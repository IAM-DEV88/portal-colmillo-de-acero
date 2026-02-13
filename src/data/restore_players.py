import json
import os

def restore_guild_leave_players(backup_file, target_file):
    if not os.path.exists(backup_file):
        print(f"❌ Backup file not found: {backup_file}")
        return
    if not os.path.exists(target_file):
        print(f"❌ Target file not found: {target_file}")
        return

    with open(backup_file, "r", encoding="utf-8") as f:
        backup_data = json.load(f)
    
    with open(target_file, "r", encoding="utf-8") as f:
        target_data = json.load(f)

    backup_players = backup_data.get("players", {})
    target_players = target_data.get("players", {})

    restored_count = 0
    for name, data in backup_players.items():
        if data.get("guildLeave") is True:
            if name not in target_players:
                # Remove "name" field if present inside player object to match current format
                if "name" in data:
                    del data["name"]
                # Clear leaderData for restored players as requested
                data["leaderData"] = {}
                target_players[name] = data
                restored_count += 1
            else:
                # If player exists but guildLeave was False, update it? 
                # User said they were lost, so they probably aren't in target_players
                pass

    target_data["players"] = target_players

    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(target_data, f, indent=4, ensure_ascii=False)

    print(f"✅ Restored {restored_count} players with guildLeave: true to {target_file}")

if __name__ == "__main__":
    restore_guild_leave_players("output - copia.json", "output.json")
