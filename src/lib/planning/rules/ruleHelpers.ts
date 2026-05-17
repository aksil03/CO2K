export const RuleHelpers = {
    adapterGrammes: (min: number, max: number, besoins: any) => {
        const echelle = besoins ? besoins.calories / 2000 : 1;
        return {
            min: Math.round(min * Math.max(0.4, echelle)),
            max: Math.round(max * Math.max(1.2, echelle * 1.8))
        };
    }
};