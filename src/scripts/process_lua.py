import json
import re
import os
import sys

def get_val(key, text):
    # String: ["key"] = "value"
    m = re.search(r'\s*\["' + re.escape(key) + r'"\]\s*=\s*"([^"]*)"', text)
    if m: return m.group(1)
    # Number: ["key"] = 123
    m = re.search(r'\s*\["' + re.escape(key) + r'"\]\s*=\s*(-?\d+)', text)
    if m: return int(m.group(1))
    return None

def extract_lua_table(text, start_pattern):
    match = re.search(start_pattern, text)
    if not match:
        return None
    
    start_index = match.end() - 1 # Position of '{'
    balance = 1
    current_index = start_index
    while current_index < len(text) - 1 and balance > 0:
        current_index += 1
        if text[current_index] == '{':
            balance += 1
        elif text[current_index] == '}':
            balance -= 1
    
    if balance == 0:
        return text[start_index : current_index + 1]
    return None

def process_lua_content(content):
    # 1. Extract Guild Header Info (Still used for lastUpdate and generatedBy)
    guild_block = extract_lua_table(content, r'\["Guild"\]\s*=\s*\{')
    if not guild_block:
        return {"error": "No se encontró la sección Guild"}
    
    current_last_update = get_val("lastUpdate", guild_block)
    generated_by = get_val("generatedBy", guild_block)
    
    if current_last_update is None or generated_by is None:
        return {"error": "No se pudo extraer lastUpdate o generatedBy"}

    # 2. Extract Members from Guild section (Base Roster)
    member_list_block = extract_lua_table(guild_block, r'\["memberList"\]\s*=\s*\{')
    if not member_list_block:
        return {"error": "No se encontró memberList en la sección Guild"}
    
    # Find all member blocks within memberList
    guild_member_blocks = re.findall(r'\{.*?\n\s*\}, -- \[\d+\]', member_list_block, re.DOTALL)

    guild_members = []
    guild_member_names = set()
    for block in guild_member_blocks:
        name = get_val("name", block)
        if not name: continue
        guild_member_names.add(name)
        guild_members.append({
            "name": name,
            "class": get_val("class", block),
            "rank": get_val("rank", block),
            "publicNote": get_val("publicNote", block),
            "officerNote": get_val("officerNote", block),
            "race": get_val("race", block)
        })

    # 3. Extract Core mentions (Additional info for leaderData)
    core_block = extract_lua_table(content, r'\["Core"\]\s*=\s*\{')
    all_cores = [] # List of all cores found
    if core_block:
        # Find all event matches
        event_matches = re.finditer(r'\{\s*\["schedule"\]\s*=\s*"([^"]*)",\s*\["minGS"\]\s*=\s*(\d+),\s*\["name"\]\s*=\s*"([^"]*)",\s*\["members"\]\s*=\s*\{', core_block)
        
        for match in event_matches:
            schedule = match.group(1)
            min_gs = int(match.group(2))
            raid_name = match.group(3)
            
            # Skip specific raids requested by user
            if raid_name in ["Evento de Fin de Mes", "Temporal"]:
                continue
            
            # Find the members for THIS specific event block
            start_pos = match.end() - 1 # Position of '{' for members
            balance = 1
            curr = start_pos
            while curr < len(core_block) - 1 and balance > 0:
                curr += 1
                if core_block[curr] == '{': balance += 1
                elif core_block[curr] == '}': balance -= 1
            
            members_content = core_block[start_pos : curr + 1]
            
            # Filter members by role (only tank, healer, dps; exclude "nuevo")
            member_blocks = re.findall(r'\{[^{}]*\}', members_content)
            valid_roles = ["tank", "healer", "dps", "melee", "rango", "melee dps", "ranged dps"]
            filtered_members = []
            
            for m_block in member_blocks:
                m_name = get_val("name", m_block)
                m_role = get_val("role", m_block)
                if m_name and m_role and m_role.lower() in valid_roles:
                    # New detailed member object
                    m_obj = {
                        "name": m_name,
                        "role": m_role,
                        "isLeader": get_val("isLeader", m_block) or 0,
                        "isSanctioned": get_val("isSanctioned", m_block) or 0
                    }
                    # Include class only if NOT in roster
                    if m_name not in guild_member_names:
                        m_obj["class"] = get_val("class", m_block)
                        
                    filtered_members.append(m_obj)
            
            all_cores.append({
                "raid": raid_name,
                "gs": min_gs,
                "schedule": schedule,
                "members": filtered_members
            })

    # 4. Construct result object
    # Collect all players from cores (to ensure they exist in players dictionary)
    core_players = {} # name -> {class, isSanctioned}
    for core in all_cores:
        for m in core["members"]:
            name = m["name"]
            if name not in core_players:
                core_players[name] = {
                    "class": m.get("class"),
                    "isSanctioned": m.get("isSanctioned", 0)
                }

    new_players = {}

    # Process players from current Guild memberList
    for m in guild_members:
        name = m["name"]
        
        player_record = {
            "name": name,
            "class": m["class"],
            "rank": m["rank"],
            "publicNote": m["publicNote"],
            "officerNote": m["officerNote"],
            "race": m["race"],
            "guildLeave": False,
            "leaderData": {}, # Will be filled if this is the generator
            "isSanctioned": core_players.get(name, {}).get("isSanctioned", 0)
        }
        
        # Update leaderData for the current generator
        if name == generated_by:
            player_record["leaderData"] = {
                "lastUpdate": current_last_update,
                "cores": all_cores
            }
        
        new_players[name] = player_record

    return {
        "globalLastUpdate": current_last_update,
        "generatedBy": generated_by,
        "players": new_players,
        "cores": all_cores
    }

if __name__ == "__main__":
    # Read from stdin
    try:
        # Read all lines from stdin
        content = sys.stdin.read()
        if not content:
            print(json.dumps({"error": "Empty input"}))
            sys.exit(1)
            
        result = process_lua_content(content)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
