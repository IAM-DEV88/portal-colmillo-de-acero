import type { RosterMember } from '../types/roster';
import { validatePublicNote } from './rosterUtils';

interface RoleStats {
  tanks: number;
  healers: number;
  dps: number;
  total: number;
}

interface MainAltStats {
  mains: number;
  alts: number;
  total: number;
}

interface GearScoreStats {
  average: number;
  min: number;
  max: number;
  total: number;
  count: number;
}

export interface RosterStats {
  totalMembers: number;
  raidLeaders: number;
  roleStats: RoleStats;
  mainAltStats: MainAltStats;
  gearScoreStats: GearScoreStats;
}

export function calculateRosterStats(members: RosterMember[]): RosterStats {
  const stats: RosterStats = {
    totalMembers: members.length,
    raidLeaders: 0,
    roleStats: { tanks: 0, healers: 0, dps: 0, total: 0 },
    mainAltStats: { mains: 0, alts: 0, total: 0 },
    gearScoreStats: { average: 0, min: Infinity, max: 0, total: 0, count: 0 }
  };

  for (const member of members) {
    // Validar la nota pública y del oficial
    const validation = validatePublicNote(member.publicNote || '', member.name, member.officerNote || '');
    
    // Log de depuración
    console.log(`[calculateRosterStats] Procesando miembro: ${member.name}`, {
      publicNote: member.publicNote,
      officerNote: member.officerNote,
      validation: {
        role: validation.role,
        dualRole: validation.dualRole,
        isRaidLeader: validation.isRaidLeader
      }
    });
    
    // Contar raid leaders
    if (validation.isRaidLeader) {
      stats.raidLeaders++;
      console.log(`[calculateRosterStats] ${member.name} es raid leader`);
    }

    // Calcular estadísticas de roles
    if (validation.role) {
      // Contar rol principal
      const mainRole = validation.role.toUpperCase();
      if (mainRole === 'T') {
        stats.roleStats.tanks++;
        console.log(`[calculateRosterStats] ${member.name} es Tank (rol principal)`);
      } else if (mainRole === 'H') {
        stats.roleStats.healers++;
        console.log(`[calculateRosterStats] ${member.name} es Healer (rol principal)`);
      } else if (mainRole === 'D') {
        stats.roleStats.dps++;
        console.log(`[calculateRosterStats] ${member.name} es DPS (rol principal)`);
      }
      
      // Contar rol dual si existe
      if (validation.dualRole) {
        const dualRole = validation.dualRole.toUpperCase();
        if (dualRole === 'T') {
          stats.roleStats.tanks++;
          console.log(`[calculateRosterStats] ${member.name} es Tank (rol dual)`);
        } else if (dualRole === 'H') {
          stats.roleStats.healers++;
          console.log(`[calculateRosterStats] ${member.name} es Healer (rol dual)`);
        } else if (dualRole === 'D') {
          stats.roleStats.dps++;
          console.log(`[calculateRosterStats] ${member.name} es DPS (rol dual)`);
        }
      }
      
      // Actualizar el total de roles (1 por rol principal + 1 por rol dual si existe)
      const rolesCount = validation.dualRole ? 2 : 1;
      stats.roleStats.total += rolesCount;
      console.log(`[calculateRosterStats] ${member.name} tiene ${rolesCount} rol(es) contabilizado(s)`);
    }

    // Calcular estadísticas de mains/alts
    if (validation.mainAlt) {
      if (validation.mainAlt === 'M') stats.mainAltStats.mains++;
      if (validation.mainAlt === 'A') stats.mainAltStats.alts++;
    } else {
      // Por defecto, considerar como main si no está especificado
      stats.mainAltStats.mains++;
    }

    // Calcular estadísticas de gear score
    if (validation.gearScore) {
      const gs = parseFloat(validation.gearScore.toString());
      if (!isNaN(gs)) {
        stats.gearScoreStats.total += gs;
        stats.gearScoreStats.count++;
        stats.gearScoreStats.min = Math.min(stats.gearScoreStats.min, gs);
        stats.gearScoreStats.max = Math.max(stats.gearScoreStats.max, gs);
      }
    }
  }

  // Calcular totales
  stats.roleStats.total = stats.roleStats.tanks + stats.roleStats.healers + stats.roleStats.dps;
  stats.mainAltStats.total = stats.mainAltStats.mains + stats.mainAltStats.alts;
  
  // Calcular promedio de gear score
  if (stats.gearScoreStats.count > 0) {
    stats.gearScoreStats.average = parseFloat((stats.gearScoreStats.total / stats.gearScoreStats.count).toFixed(2));
  } else {
    stats.gearScoreStats.min = 0;
  }

  return stats;
}

export function getRolePercentage(roleCount: number, total: number): number {
  return total > 0 ? Math.round((roleCount / total) * 100) : 0;
}

export function getRoleColor(role: 'T' | 'H' | 'D'): string {
  const colors = {
    T: 'bg-blue-500',
    H: 'bg-green-500',
    D: 'bg-red-500'
  };
  return colors[role] || 'bg-gray-500';
}

export function getRoleName(role: 'T' | 'H' | 'D'): string {
  const names = {
    T: 'Tanques',
    H: 'Sanadores',
    D: 'DPS'
  };
  return names[role] || 'Desconocido';
}
