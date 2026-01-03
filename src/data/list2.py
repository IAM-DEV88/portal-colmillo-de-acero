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

def get_raid_stats(text):
    stats = {"byZone": {}, "total": 0}
    
    print(f"DEBUG: get_raid_stats input text (first 200 chars): {text[:200]}")

    # Total
    print(f"DEBUG: Attempting to find 'total' in text (first 200 chars): {text[:200]}")
    total_match = re.search(r'\s*\["total"\]\s*=\s*(-?\d+)', text)
    if total_match:
        total = int(total_match.group(1))
        stats["total"] = total
        print(f"DEBUG: Total found: {total}")
    else:
        print(f"DEBUG: No total match found for pattern: {'\\s*\\["total"\\]\\s*=\\s*(-?\\d+)'}")
        
    # byZone
    print(f"DEBUG: Attempting to find 'byZone' in text (first 200 chars): {text[:200]}")
    bz_match = re.search(r'\s*\["byZone"\]\s*=\s*\{(.*?)\}', text, re.DOTALL)
    if bz_match:
        print(f"DEBUG: byZone match found. Group 1 (first 100 chars): {bz_match.group(1)[:100]}")
        zones = re.findall(r'\["([^"]+)"\]\s*=\s*(\d+)', bz_match.group(1))
        for z, v in zones: stats["byZone"][z] = int(v)
        print(f"DEBUG: byZone stats: {stats['byZone']}")
    else:
        print(f"DEBUG: No byZone match found for pattern: {'\\s*\\["byZone"\\]\\s*=\\s*\\{(.*?)\\}'}")

    return stats
            
def lua_to_json(lua_file, json_file):
    try:
        with open(lua_file, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"⚠ No se encontró el archivo {lua_file}")
        return

    # 1. Extract Guild Header Info
    guild_match = re.search(r'\["Guild"\]\s*=\s*\{(.*?)\s*\["memberList"\]', content, re.DOTALL)
    if not guild_match:
        print("❌ No se encontró la sección Guild")
        return
    
    guild_header = guild_match.group(1)
    current_last_update = get_val("lastUpdate", guild_header)
    generated_by = get_val("generatedBy", guild_header)
    
    if current_last_update is None or generated_by is None:
        print("❌ No se pudo extraer lastUpdate o generatedBy")
        return

    # 2. Extract Members
    start_match = re.search(r'\["memberList"\]\s*=\s*\{', content)
    if not start_match:
        print("❌ No se encontró memberList")
        return
    
    start_pos = start_match.end()
    # Find all member blocks ending with }, -- [index]
    member_blocks = re.findall(r'\{.*?\n\s*\}, -- \[\d+\]', content[start_pos:], re.DOTALL)
    
    if not member_blocks:
        print("❌ No se encontraron bloques de miembros")
        return

    print(f"--- Miembros encontrados ({len(member_blocks)}) ---")
    
    new_members = []
    for block in member_blocks:
        name = get_val("name", block)
        if not name: continue
        print(f"DEBUG: Processing member: {name}")
        print(f"DEBUG: Full member block for {name} (first 500 chars): {block[:500]}")
        
        # Regex to capture the entire raidStats block, handling nested curly braces
        raid_stats_start_match = re.search(r'\["raidStats"\]\s*=\s*\{', block)
        if raid_stats_start_match:
            start_index = raid_stats_start_match.end() - 1 # Adjust to include the opening brace
            balance = 1
            current_index = start_index
            while current_index < len(block) and balance > 0:
                current_index += 1
                if block[current_index] == '{':
                    balance += 1
                elif block[current_index] == '}':
                    balance -= 1
            raid_stats_block = block[start_index:current_index+1]
        else:
            raid_stats_block = ""
        print(f"DEBUG: raid_stats_block for {name} (first 200 chars): {raid_stats_block[:200]}")
        
        member = {
            "name": name,
            "class": get_val("class", block),
            "rank": get_val("rank", block),
            "publicNote": get_val("publicNote", block),
            "officerNote": get_val("officerNote", block),
            "race": get_val("race", block),
            "raidStats": get_raid_stats(raid_stats_block)
        }
        new_members.append(member)

    # 3. Consolidate
    if os.path.exists(json_file):
        with open(json_file, "r", encoding="utf-8") as f:
            try:
                consolidated = json.load(f)
            except json.JSONDecodeError:
                consolidated = {"globalLastUpdate": 0, "players": {}}
    else:
        consolidated = {"globalLastUpdate": 0, "players": {}}

    # Ensure structure
    if "players" not in consolidated: consolidated["players"] = {}
    if "globalLastUpdate" not in consolidated: consolidated["globalLastUpdate"] = 0

    # Update globalLastUpdate
    if current_last_update > consolidated["globalLastUpdate"]:
        consolidated["globalLastUpdate"] = current_last_update

    # Track names in this update to detect who left
    names_in_update = {m["name"] for m in new_members}

    # Update existing players and add new ones
    for m in new_members:
        name = m["name"]
        if name not in consolidated["players"]:
            consolidated["players"][name] = {
                "name": name,
                "class": m["class"],
                "rank": m["rank"],
                "publicNote": m["publicNote"],
                "officerNote": m["officerNote"],
                "race": m["race"],
                "guildLeave": False,
                "leaderData": {}
            }
        
        p = consolidated["players"][name]
        # Update basic info (always take latest from current file)
        p["class"] = m["class"] or p.get("class", "")
        p["rank"] = m["rank"] or p.get("rank", "")
        p["publicNote"] = m["publicNote"] or p.get("publicNote", "")
        p["officerNote"] = m["officerNote"] or p.get("officerNote", "")
        if m["race"]: p["race"] = m["race"]
        
        # Player is present in this update
        p["guildLeave"] = False
        
        # Update leader-specific data
        if "leaderData" not in p: p["leaderData"] = {}
        
        p["leaderData"][generated_by] = {
            "lastUpdate": current_last_update,
            "raidStats": m["raidStats"]
        }

    # Mark players not in this update as guildLeave
    # Only do this if the current update is actually the latest one we've seen
    if current_last_update >= consolidated["globalLastUpdate"]:
        for name, p in consolidated["players"].items():
            if name not in names_in_update:
                p["guildLeave"] = True

    # 4. Save
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(consolidated, f, indent=4, ensure_ascii=False)
    
    print(f"✅ Consolidación completada. Se actualizó {json_file}")
    print(f"   Líder: {generated_by}, Update: {current_last_update}")

if __name__ == "__main__":
    lua_file = "RaidDominion2.lua"
    json_file = "output.json"
    lua_to_json(lua_file, json_file)