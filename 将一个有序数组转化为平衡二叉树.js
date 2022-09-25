function Node(data,left,right){
    this.data=data;
    this.left=left;
    this.right=right;
}
function arrConvertBST(arr){
    var len =arr.length;
    if(len<=0){
        return null;
    }
    return BST(arr);
}
function BST(arr){
    if(arr.length<=0){
        return null;
    }else{
        var mid=Math.floor((arr.length/2))
        var root=new Node(arr[mid],null,null);
        var left=arr.slice(0,mid);
        var right=arr.slice(mid+1);
        root.left=BST(left);
        root.right=BST(right);
        return root;
    }
}