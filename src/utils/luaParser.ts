/**
 * Utility to parse Lua-like tables from strings.
 * Ported from src/scripts/process_lua.py to TypeScript to support serverless environments (Netlify).
 */

function getVal(key: string, text: string): string | number | null {
  // String: ["key"] = "value"
  const stringRegex = new RegExp(`\\s*\\["${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\]\\s*=\\s*"([^"]*)"`);
  const stringMatch = text.match(stringRegex);
  if (stringMatch) return stringMatch[1];

  // Number: ["key"] = 123
  const numberRegex = new RegExp(`\\s*\\["${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\]\\s*=\\s*(-?\\d+)`);
  const numberMatch = text.match(numberRegex);
  if (numberMatch) return parseInt(numberMatch[1], 10);

  return null;
}

function extractLuaTable(text: string, startPattern: string): string | null {
  const regex = new RegExp(startPattern);
  const match = text.match(regex);
  if (!match) return null;

  const startIndex = (match.index || 0) + match[0].length - 1; // Position of '{'
  let balance = 1;
  let currentIndex = startIndex;

  while (currentIndex < text.length - 1 && balance > 0) {
    currentIndex++;
    if (text[currentIndex] === '{') {
      balance++;
    } else if (text[currentIndex] === '}') {
      balance--;
    }
  }

  if (balance === 0) {
    return text.substring(startIndex, currentIndex + 1);
  }
  return null;
}

export interface ParsedRoster {
  globalLastUpdate: number;
  generatedBy: string;
  players: Record<string, any>;
  cores: any[];
  error?: string;
}

export function parseLuaRoster(content: string): ParsedRoster | { error: string } {
  // 1. Extract Guild Header Info
  const guildBlock = extractLuaTable(content, '\\["Guild"\\]\\s*=\\s*\\{');
  if (!guildBlock) {
    return { error: "No se encontró la sección Guild" };
  }

  const currentLastUpdate = getVal("lastUpdate", guildBlock);
  const generatedBy = getVal("generatedBy", guildBlock);

  if (currentLastUpdate === null || generatedBy === null) {
    return { error: "No se pudo extraer lastUpdate o generatedBy" };
  }

  // 2. Extract Members from Guild section
  const memberListBlock = extractLuaTable(guildBlock, '\\["memberList"\\]\\s*=\\s*\\{');
  if (!memberListBlock) {
    return { error: "No se encontró memberList en la sección Guild" };
  }

  // Find all member blocks within memberList
  const guildMemberBlocks = memberListBlock.match(/\{.*?\n\s*\}, -- \[\d+\]/gs) || [];

  const guildMembers: any[] = [];
  const guildMemberNames = new Set<string>();

  for (const block of guildMemberBlocks) {
    const name = getVal("name", block) as string;
    if (!name) continue;
    guildMemberNames.add(name);
    guildMembers.push({
      name,
      class: getVal("class", block),
      rank: getVal("rank", block),
      publicNote: getVal("publicNote", block),
      officerNote: getVal("officerNote", block),
      race: getVal("race", block),
    });
  }

  // 3. Extract Core mentions
  const coreBlock = extractLuaTable(content, '\\["Core"\\]\\s*=\\s*\\{');
  const allCores: any[] = [];

  if (coreBlock) {
    const eventRegex = /\{\s*\["schedule"\]\s*=\s*"([^"]*)",\s*\["minGS"\]\s*=\s*(\d+),\s*\["name"\]\s*=\s*"([^"]*)",\s*\["members"\]\s*=\s*\{/g;
    let match;

    while ((match = eventRegex.exec(coreBlock)) !== null) {
      const schedule = match[1];
      const minGs = parseInt(match[2], 10);
      const raidName = match[3];

      if (["Evento de Fin de Mes", "Temporal"].includes(raidName)) {
        continue;
      }

      const startPos = eventRegex.lastIndex - 1; // Position of '{' for members
      let balance = 1;
      let curr = startPos;
      while (curr < coreBlock.length - 1 && balance > 0) {
        curr++;
        if (coreBlock[curr] === '{') balance++;
        else if (coreBlock[curr] === '}') balance--;
      }

      const membersContent = coreBlock.substring(startPos, curr + 1);
      const memberBlocks = membersContent.match(/\{[^{}]*\}/g) || [];
      const validRoles = ["tank", "healer", "dps", "melee", "rango", "melee dps", "ranged dps"];
      const filteredMembers: any[] = [];

      for (const mBlock of memberBlocks) {
        const mName = getVal("name", mBlock) as string;
        const mRole = getVal("role", mBlock) as string;
        if (mName && mRole && validRoles.includes(mRole.toLowerCase())) {
          const mObj: any = {
            name: mName,
            role: mRole,
            isLeader: getVal("isLeader", mBlock) || 0,
            isSanctioned: getVal("isSanctioned", mBlock) || 0,
          };

          if (!guildMemberNames.has(mName)) {
            mObj.class = getVal("class", mBlock);
          }
          filteredMembers.push(mObj);
        }
      }

      allCores.push({
        raid: raidName,
        gs: minGs,
        schedule,
        members: filteredMembers,
      });
    }
  }

  // 4. Construct result object
  const corePlayers: Record<string, any> = {};
  for (const core of allCores) {
    for (const m of core.members) {
      if (!corePlayers[m.name]) {
        corePlayers[m.name] = {
          class: m.class,
          isSanctioned: m.isSanctioned || 0,
        };
      }
    }
  }

  const newPlayers: Record<string, any> = {};
  for (const m of guildMembers) {
    const name = m.name;
    const playerRecord: any = {
      name,
      class: m.class,
      rank: m.rank,
      publicNote: m.publicNote,
      officerNote: m.officerNote,
      race: m.race,
      guildLeave: false,
      leaderData: {},
      isSanctioned: corePlayers[name]?.isSanctioned || 0,
    };

    if (name === generatedBy) {
      playerRecord.leaderData = {
        lastUpdate: currentLastUpdate,
        cores: allCores,
      };
    }

    newPlayers[name] = playerRecord;
  }

  return {
    globalLastUpdate: currentLastUpdate as number,
    generatedBy: generatedBy as string,
    players: newPlayers,
    cores: allCores,
  };
}
