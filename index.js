var events = require('events');
var util = require('util');

var LRU = module.exports = function (max) {
    events.EventEmitter.call(this);
    this.cache = {}
    this.head = this.tail = null;
    this.length = 0;
    this.max = max || 1000;
};
util.inherits(LRU, events.EventEmitter);

LRU.prototype.remove = function (key) {
    var element = this.cache[key];

    if(element) {
        delete this.cache[key];

        --this.length;

        if(element.prev) this.cache[element.prev].next = element.next;
        if(element.next) this.cache[element.next].prev = element.prev;

        if(this.head == key) {
            this.head = element.prev;
        }

        if(this.tail == key) {
            this.tail = element.next;
        }
    }
    return element;
}

LRU.prototype.set = function (key, value) {
    if( this.cache.hasOwnProperty(key) ) {
        element = this.cache[key]
        element.value = value

        // If it's already the head, there's nothing more to do:
        if( key === this.head ) {
            return value;
        }
    } else {
        element = { value:value };

        this.cache[key] = element;

        // Eviction is only possible if the key didn't already exist:
        if (++this.length > this.max) {
            this.evict();
        }
    }

    element.next = null;
    element.prev = this.head;

    if (this.head) {
        this.cache[this.head].next = key;
    }
    this.head = key;

    if(!this.tail) {
      this.tail = key;
    }

    return value
};

LRU.prototype.get = function (key) {
    var element = this.cache[key];
    if (!element) { return; }

    if( this.length > 1 ) {
        // Tail only changes if this was the tail:
        if( key === this.tail ) this.tail = element.next

        if( this.head !== key ) {
            // Set prev -> next:
            if( element.prev ) this.cache[element.prev].next = element.next

            // Set prevhead->next:
            if( this.head ) this.cache[this.head].next = key
        }

        // Set next -> prev:
        if( element.next ) this.cache[element.next].prev = element.prev

        // Set new head:
        this.head = key
    }

    return element.value;
};

LRU.prototype.evict = function () {
    if(!this.tail) { return; }
    var key = this.tail;
    var element = this.remove(this.tail);
    this.emit('evict', {key:key, value:element.value});
};

