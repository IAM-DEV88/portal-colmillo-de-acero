// WotLK Raid Configuration
// This file contains the raid definitions used across the application

export interface Raid {
    id: number;
    name: string;
    image: string;
    description: string;
    minGearScore: number;
}

export const wotlkRaids: Raid[] = [
    {
        id: 1,
        name: 'TOC 10N FARM',
        image: '/images/raids/tocfarm.jpg',
        description:
            'Se ponen a prueba el conocimiento de mecanicas de grupo y habilidad para el combate.',
        minGearScore: 4800,
    },
    {
        id: 2,
        name: 'ICC 10N FARM',
        image: '/images/raids/iccfarm.jpg',
        description:
            'Se ponen a prueba el conocimiento de mecanicas de grupo y habilidad para el combate.',
        minGearScore: 5000,
    },
    {
        id: 3,
        name: 'ICC 25N FARM',
        image: '/images/raids/iccfarm.jpg',
        description:
            'Se ponen a prueba el conocimiento de mecanicas de grupo y habilidad para el combate.',
        minGearScore: 5400,
    },
    {
        id: 4,
        name: 'ICC 10N POR LK',
        image: '/images/raids/icclk.jpg',
        description: 'Jugadores con experiencia que buscan el logro de ICC10N.',
        minGearScore: 5700,
    },
    {
        id: 5,
        name: 'SAGRARIO RUBY',
        image: '/images/raids/sr.jpg',
        description: 'Jugadores con experiencia que buscan el logro de SR.',
        minGearScore: 5800,
    },
    {
        id: 6,
        name: 'ICC 25N POR LK',
        image: '/images/raids/icclk.jpg',
        description: 'Jugadores con experiencia que buscan el logro de ICC25N.',
        minGearScore: 5800,
    },
    {
        id: 7,
        name: 'ICC 10H FARM',
        image: '/images/raids/iccfarm.jpg',
        description:
            'Se ponen a prueba el conocimiento de mecanicas de grupo y habilidad para el combate.',
        minGearScore: 5900,
    },
    {
        id: 8,
        name: 'ICC 25H FARM',
        image: '/images/raids/iccfarm.jpg',
        description:
            'Se ponen a prueba el conocimiento de mecanicas de grupo y habilidad para el combate.',
        minGearScore: 6000,
    },
];
