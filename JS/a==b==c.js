var a={
    i:1,
    toString(){
        return a.i++
    }
};
if(a==1 && a==2 && a==3){
    console.log('yes')
}else{
    console.log('no')
}