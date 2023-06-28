
const a = { a: 1, b: { c: 2, d: { e: 3, f: 4 }}, g: [5, 6, { h: 7 }]}

const b = {
    "a": 1, "b.c": 2,
    "b.d.e": 3, "b.d.f": 4,
    "g.0": 5, "g.1": 6, "g.2.h": 7
}


function trans(before, newObj = {}, key = null) {
    const keys = Object.keys(before).length
    if(!keys){
        return
    }
    for(let i in before){
        let str
        if (key) {
            str = `${key}.${i}`
        } else {
            str = `${i}`
        }
        if(Object.keys(before[i]).length && typeof before === 'object' && before !== null) {
            trans(before[i], newObj, str)
        } else {
            newObj[str] = before[i]
        }
    }
    return newObj
}
const res = trans(a)
console.log(res)