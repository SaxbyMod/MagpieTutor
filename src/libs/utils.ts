/** Calculate the similarity between 2 strings using Sørensen–Dice's coefficient */
export function cmpStr(fst: string, snd: string): number {
    const genBi = (inp: string) => Array.from({ length: inp.length - 1 }, (_, i) => inp.slice(i, i + 2)) // bigrams generator helper
    const [fstBi, sndBi] = [genBi(fst), genBi(snd)] // gen bigrams
    return (2 * fstBi.filter((v) => sndBi.includes(v)).length) / fstBi.length + sndBi.length
}

/** Intersection between 2 arrays*/
export function inter<T>(fst: T[], snd: T[]): T[] {
    return fst.filter((v) => snd.includes(v))
}

/** Difference between 2 arrays*/
export function diff<T>(fst: T[], snd: T[]): T[] {
    return fst.filter((v) => !snd.includes(v))
}

/** Union between 2 arrays*/
export function uni<T>(fst: T[], snd: T[]): T[] {
    return fst.concat(snd)
}
