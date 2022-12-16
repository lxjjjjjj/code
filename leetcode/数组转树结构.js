const arr = [{
    id: 2,
    name: '部门B',
    parentId: 0
},
{
    id: 3,
    name: '部门C',
    parentId: 1
},
{
    id: 1,
    name: '部门A',
    parentId: 2
},
{
    id: 4,
    name: '部门D',
    parentId: 1
},
{
    id: 5,
    name: '部门E',
    parentId: 2
},
{
    id: 6,
    name: '部门F',
    parentId: 3
},
{
    id: 7,
    name: '部门G',
    parentId: 2
},
{
    id: 8,
    name: '部门H',
    parentId: 4
}
]
// 从头节点往下遍历，一层一层的节点找 找出以根节点为父节点的节点，递归结束条件是没有找到相应的节点
function transTree(arr) {
    arr.sort((a, b) => a.parentId - b.parentId)
    let tree = arr.splice(0, 1)[0]
    function loop(parent = tree){
        const children = arr.filter(item => item.parentId === parent.id)
        if(!children.length) return
        parent.children = children
        parent.children.forEach((_, index) => {
            loop(parent.children[index])
        })
    }
    loop()
    return tree
}
const tree = transTree(arr)
console.log('tree', JSON.stringify(tree))
