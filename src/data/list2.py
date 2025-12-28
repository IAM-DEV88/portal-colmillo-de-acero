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
    
    # Buscar directamente los bloques de miembros
    # Patrón para encontrar cada entrada de miembro con todos los campos
    member_pattern = r'\{\s*\[\"name\"\]\s*=\s*\"([^\"]*)\"\s*,\s*\[\"officerNote\"\]\s*=\s*\"([^\"]*)\"\s*,\s*\[\"class\"\]\s*=\s*\"([^\"]*)\"\s*,\s*\[\"publicNote\"\]\s*=\s*\"([^\"]*)\"\s*,\s*\[\"rank\"\]\s*=\s*\"([^\"]*)\"'
    
    # Buscar todos los miembros en el archivo
    member_matches = list(re.finditer(member_pattern, content, re.DOTALL))
    
    if not member_matches:
        print("❌ No se encontraron miembros en el archivo")
        return
    
    print(f"--- Miembros encontrados ({len(member_matches)}) ---")
    
    for match in member_matches:
        name, officer_note, cls, public_note, rank = match.groups()
        
        # Limpiar los valores
        name = name.strip()
        cls = cls.strip()
        rank = rank.strip()
        public_note = public_note.strip()
        officer_note = officer_note.strip()
        
        members.append({
            'name': name,
            'class': cls,
            'rank': rank,
            'publicNote': public_note,
            'officerNote': officer_note
        })
    
    # 5. Guardar en JSON
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(members, f, ensure_ascii=False, indent=4)
    
    print(f"✅ Conversión completada. Se guardó en {json_file}")
    

if __name__ == "__main__":
    lua_file = "RaidDominion2.lua"
    json_file = "output.json"
    lua_to_json(lua_file, json_file)