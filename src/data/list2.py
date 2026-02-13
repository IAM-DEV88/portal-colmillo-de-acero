import json
import re
import os

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

def lua_to_json(lua_file, json_file):
    try:
        with open(lua_file, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"⚠ No se encontró el archivo {lua_file}")
        return

    # 1. Extract Guild Header Info (Still used for lastUpdate and generatedBy)
    guild_block = extract_lua_table(content, r'\["Guild"\]\s*=\s*\{')
    if not guild_block:
        print("❌ No se encontró la sección Guild")
        return
    
    current_last_update = get_val("lastUpdate", guild_block)
    generated_by = get_val("generatedBy", guild_block)
    
    if current_last_update is None or generated_by is None:
        print("❌ No se pudo extraer lastUpdate o generatedBy")
        return

    # 2. Extract Members from Guild section (Base Roster)
    member_list_block = extract_lua_table(guild_block, r'\["memberList"\]\s*=\s*\{')
    if not member_list_block:
        print("❌ No se encontró memberList en la sección Guild")
        return
    
    # Find all member blocks within memberList
    guild_member_blocks = re.findall(r'\{.*?\n\s*\}, -- \[\d+\]', member_list_block, re.DOTALL)
    print(f"--- Miembros encontrados en Guild ({len(guild_member_blocks)}) ---")

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
            valid_roles = ["tank", "healer", "dps"]
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

        print(f"--- Cores encontrados ({len(all_cores)}) ---")
    else:
        print("⚠ No se encontró la sección Core")

    # 4. Consolidate
    if os.path.exists(json_file):
        with open(json_file, "r", encoding="utf-8") as f:
            try:
                consolidated = json.load(f)
            except json.JSONDecodeError:
                consolidated = {"globalLastUpdate": 0, "players": {}}
    else:
        consolidated = {"globalLastUpdate": 0, "players": {}}

    # We will keep players who are in the CURRENT memberList 
    # AND players who have "guildLeave": True (previously departed)
    existing_players = consolidated.get("players", {})
    new_players = {}

    # Update globalLastUpdate
    if current_last_update > consolidated["globalLastUpdate"]:
        consolidated["globalLastUpdate"] = current_last_update

    # 1. Process players from current Guild memberList
    for m in guild_members:
        name = m["name"]
        
        # If player existed before, we might want to preserve their leaderData from other leaders
        old_player_data = existing_players.get(name, {})
        old_leader_data = old_player_data.get("leaderData", {})
        
        # Ensure old_leader_data is a dictionary
        if not isinstance(old_leader_data, dict):
            old_leader_data = {}

        player_record = {
            "class": m["class"],
            "rank": m["rank"],
            "publicNote": m["publicNote"],
            "officerNote": m["officerNote"],
            "race": m["race"],
            "guildLeave": False,
            "leaderData": old_leader_data
        }
        
        # Update leaderData for the current generator
        if name == generated_by:
            # Flattened structure: no leader name key, just the data
            player_record["leaderData"] = {
                "lastUpdate": current_last_update,
                "cores": all_cores
            }
        
        new_players[name] = player_record

    # 2. Preserve players with guildLeave: True
    for name, data in existing_players.items():
        if data.get("guildLeave") is True and name not in new_players:
            # Point 3: Clear leaderData for recovered players who left the guild
            data["leaderData"] = {}
            new_players[name] = data

    # Replace old players with the new consolidated list
    consolidated["players"] = new_players

    # 5. Save
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(consolidated, f, indent=4, ensure_ascii=False)
    
    print(f"✅ Consolidación completada. Se actualizó {json_file}")
    print(f"   Líder: {generated_by}, Update: {current_last_update}")


if __name__ == "__main__":
    # Try RaidDominion-main.lua first, then RaidDominion2.lua
    lua_file = "RaidDominion-main.lua"
    if not os.path.exists(lua_file):
        lua_file = "RaidDominion2.lua"
    
    json_file = "output.json"
    print(f"--- Procesando {lua_file} ---")
    lua_to_json(lua_file, json_file)