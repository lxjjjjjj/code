 //                 0
 //          1             2
 //    3         4     5        6
 // 7     8   9   10 11 12    13  14
 // 

 function TreeNode(value) {
    this.value = value
    this.left = null
    this.right = null 
 }
 const arr = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]
 function generateTree(arr) {
    const root = new TreeNode(arr.shift())
    const stack = [root]
    function genTree() {
        while(arr.length) {
            const parent = stack.pop()
            const leftNode = new TreeNode(arr.shift())
            const rightNode = new TreeNode(arr.shift())
            parent.left = leftNode
            stack.unshift(leftNode)
            parent.right = rightNode
            stack.unshift(rightNode)
        }
    }
    genTree()
    return root
 }
//  console.log('generateTree', generateTree(arr))
 function traverseTree(root) {
    const res = []
    let left = false
    function traverse(stack) {
        left = !left
        if(!stack.length) return 
        const newStack = []
        while(stack.length) {
            const node = stack.pop()
            res.push(node.value)
            if (left) {
                node.right && newStack.push(node.right)
                node.left && newStack.push(node.left)
            } else {
                node.left && newStack.push(node.left)
                node.right && newStack.push(node.right)
            }
        }
        traverse(newStack)
    }
    traverse([root])
    return res
 }
 console.log(traverseTree(generateTree(arr)))