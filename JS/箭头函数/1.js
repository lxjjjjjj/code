let x={
    num:1,
    sum:function(data){
        return this.num+data
    }
}
let y={
    num:1,
    sum:data=>{
        // this 是 window
        return this.num+data
    }
}
console.log(x.sum(1))//2
console.log(y.sum(1))//NaN