function BinaryTree(){
    //创建二叉树的基本结构
    var Node = function(key){
        this.key = key;
        this.left = null;
        this.right = null;
    };

    var root = null;//根节点的值

    //放置左右节点的值
    var insertNode = function(node,newNode){
        if(newNode.key<node.key){
            if(node.left === null){
                node.left = newNode;
            }else{
                insertNode(node.left,newNode)
            }
        }else{
            if(node.right === null){
                node.right = newNode;
            }else{
                insertNode(node.right,newNode)
            }
        }
    };

    //判断有无父节点
    this.insert = function(key){
        var newNode = new Node(key);
        if(root === null){
            root = newNode;
        }else{
            insertNode(root,newNode)
        }
    };
}
var nodes = [8,3,10,1,6,14,4,7,13];
var binaryTree = new BinaryTree();
nodes.forEach( function(key) {
    binaryTree.insert(key);
});

var callback = function(key){
    console.log(key);
}
//中序遍历
// binaryTree.inOrderTraverse(callback);
//前序遍历
// binaryTree.preOrderTraverse(callback);
//后序遍历
binaryTree.postOrderTraverse(callback);

// 1、前序遍历
// 先输出当前结点的数据，再依次遍历输出左结点和右结点

var preOrderTraverseNode = function(node,callback){
                if(node !== null){
                    callback(node.key);
                    preOrderTraverseNode(node.left,callback);
                    preOrderTraverseNode(node.right,callback);
                }
            }

            this.preOrderTraverse = function(callback){
                preOrderTraverseNode(root,callback);
            }


// 2、中序遍历
// 先遍历输出左结点，再输出当前结点的数据，再遍历输出右结点

var inOrderTraverseNode = function(node,callback){
                //如果node为null返回callback
                if(node !== null){
                    inOrderTraverseNode(node.left,callback);
                    callback(node.key);
                    inOrderTraverseNode(node.right,callback);
                }
            }

            this.inOrderTraverse = function(callback){
                inOrderTraverseNode(root,callback);
            }

// 3、后序遍历
// 先遍历输出左结点，再遍历输出右结点，最后输出当前结点的数据

var postOrderTraverseNode = function(node,callback){
                if(node !== null){
                    postOrderTraverseNode(node.left,callback);
                    postOrderTraverseNode(node.right,callback);
                    callback(node.key);
                }
            }

            this.postOrderTraverse = function(callback){
                postOrderTraverseNode(root,callback);
            }
