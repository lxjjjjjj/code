// 给你一个链表，删除链表的倒数第 n 个结点，并且返回链表的头结点。
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */

// 快慢指针，定义两个指针，快指针fast，慢指针slow，
// 快指针先走n步，
// 如果快指针指向null，说明链表已经被走完了，要删除的是头结点，因此直接返回 head.next
// 然后快慢指针一起走，
// 等快指针走到最后一个节点了，慢指针指向的就是倒数n的节点的前一个节点
// 将慢指针的next指向改变成next.next就行
// 最后返回head


var removeNthFromEnd = function(head, n) {
    let fast = head, slow = head
    while(n-- > 0) {
        fast = fast.next
    }
    if (fast == null) return head.next
    while(fast.next) {
        fast = fast.next
        slow = slow.next
    }
    slow.next = slow.next.next
    return head
};