import json
import re

def lua_to_json(lua_file, json_file):
    try:
        with open(lua_file, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"⚠ No se encontró el archivo {lua_file}")
        return

    members = []
    
    # Strategy: Find all innermost blocks {...} that contain ["name"]
    # This avoids issues with field order or extra fields like faction/race
    # [^{}]* ensures we don't match across multiple blocks or nested ones (though members are flat)
    block_pattern = r'\{[^{}]*\[\"name\"\][^{}]*\}'
    
    # Find all member blocks
    member_blocks = re.findall(block_pattern, content, re.DOTALL)
    
    if not member_blocks:
        print("❌ No se encontraron miembros en el archivo")
        return
    
    print(f"--- Miembros encontrados ({len(member_blocks)}) ---")
    
    for block in member_blocks:
        # Helper function to extract a string field value
        def get_field(field_name, text):
            # Matches ["field"] = "value"
            pattern = r'\[' + re.escape(f'"{field_name}"') + r'\]\s*=\s*\"([^\"]*)\"'
            match = re.search(pattern, text)
            if match:
                return match.group(1)
            return ""

        # Helper function to extract a numeric field value
        def get_number_field(field_name, text):
            # Matches ["field"] = 123
            pattern = r'\[' + re.escape(f'"{field_name}"') + r'\]\s*=\s*(\d+)'
            match = re.search(pattern, text)
            if match:
                return int(match.group(1))
            return None

        name = get_field("name", block)
        cls = get_field("class", block)
        rank = get_field("rank", block)
        public_note = get_field("publicNote", block)
        officer_note = get_field("officerNote", block)
        
        # Optional fields
        faction = get_field("faction", block)
        race = get_field("race", block)
        sex = get_number_field("sex", block)
        
        if name:
            member_data = {
                'name': name.strip(),
                'class': cls.strip(),
                'rank': rank.strip(),
                'publicNote': public_note.strip(),
                'officerNote': officer_note.strip()
            }
            
            # Add optional fields if they exist
            if faction:
                member_data['faction'] = faction.strip()
            if race:
                member_data['race'] = race.strip()
            if sex is not None:
                member_data['sex'] = sex
                
            members.append(member_data)
    
    # Save to JSON
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(members, f, ensure_ascii=False, indent=4)
    
    print(f"✅ Conversión completada. Se guardó en {json_file}")

if __name__ == "__main__":
    lua_file = "RaidDominion2.lua"
    json_file = "output.json"
    lua_to_json(lua_file, json_file)