// https://segmentfault.com/a/1190000020072884
//冒泡
function bubbleSort(arr){
    var len=arr.length;
    for(var i=0;i,len;i++){
        for(var j=0;j<len-1-i;j++){
            if(arr[j]>arr[j+1]){
                var temp=arr[j+1];
                arr[j+1]=arr[j];
                arr[j]=temp;
            }
        }
    }
    return arr;
}
// 选择
function selectionSort(arr){
    var len=arr.length;
    var minIndex,temp;
    for(var i=0;i<len-1;i++){
        minIndex=i;
        for(var j=i+1;j<len;j++){
            if(arr[j]<arr[minIndex]){
                minIndex=j;
            }
        }
        temp=arr[i];
        arr[i]=arr[minIndex];
        arr[minIndex]=temp;
    }
    return arr;
}
// 插入
function insertionSort(array){
    if(Object.prototype.toString.call(array).slice(8,-1)==='Array'){
        for(var i=1;i<array.length;i++){
            var key=array[i];
            var j=i-1;
            while(j>=0 && array[j]>key){
                array[j+1]=array[j];
                j--;
            }
            array[j+1]=key;
        }
    }else{
        return 'array is not Array !'
    }
}
// 二分查找插入
function binaryInsertionSort(array){
    for(var i=1;i<array.length;i++){
        var key=array[i],left=0,right=i-1;
        while(left<=right){
            var middle=parseInt((left+right)/2);
            if(key<array[middle]){
                right=middle-1;
            }else{
                left=middle+1;
            }
        }
        for(var j=i-1;j>=left;j--){
            array[j+1]=array[j];
        }
        array[left]=key;
    }
    return array;
}
// 归并排序
function mergeSort(arr) { // 采用自上而下的递归方法
    var len = arr.length;
    if (len < 2) {
        return arr;
    }
    var middle = Math.floor(len / 2),
        left = arr.slice(0, middle),
        right = arr.slice(middle);
    return merge(mergeSort(left), mergeSort(right));
}
 
function merge(left, right) {
    var result = [];
 
    while (left.length>0 && right.length>0) {
        if (left[0] <= right[0]) {
            result.push(left.shift());
        }else {
            result.push(right.shift());
        }
    }
 
    while (left.length)
        result.push(left.shift());
 
    while (right.length)
        result.push(right.shift());
 
    return result;
}
// 快速排序
function quickSort(arr){
    if(arr.length<=1){
        return arr;
    }
    let pivotIndex = Math.floor(arr.length/2);
    let pivot = arr.splice(pivotIndex,1)[0];
    let left = [];
    let right = [];
    for(let i=0;i<arr.length;i++){
        if(arr[i]<pivot){
            left.push(arr[i])
        }else{
            right.push(arr[i])
        }
    }
    return quickSort(left).concat([pivot],qucikSort(right));
}
// 计数排序
function countingSort(arr, maxValue) {
    var bucket =new Array(maxValue + 1),
        sortedIndex = 0;
        arrLen = arr.length,
        bucketLen = maxValue + 1;
 
    for (var i = 0; i < arrLen; i++) {
        if (!bucket[arr[i]]) {
            bucket[arr[i]] = 0;
        }
        bucket[arr[i]]++;
    }
 
    for (var j = 0; j < bucketLen; j++) {
        while(bucket[j] > 0) {
            arr[sortedIndex++] = j;
            bucket[j]--;
        }
    }
 
    return arr;
}



// 希尔排序
function shellSort(arr) {

    var len = arr.length,

        temp,

        gap = 1;

    while (gap < len / 3) {         // 动态定义间隔序列

        gap = gap * 3 + 1;

    }

    for (gap; gap > 0; gap = Math.floor(gap / 3)) {

        for (var i = gap; i < len; i++) {

            temp = arr[i];

            for (var j = i-gap; j > 0 && arr[j]> temp; j-=gap) {

                arr[j + gap] = arr[j];

            }

            arr[j + gap] = temp;

        }

    }

    return arr;

}

