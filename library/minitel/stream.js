"use strict"
/**
 * @file Stream
 * @author Frédéric BISSON <zigazou@free.fr>
 * @version 1.0
 * 
 * A Minitel Stream is an helper class which transforms any kind of JavaScript
 * type (string, number, array etc.) to an array of integers.
 *
 * A Minitel Stream is a queue.
 *
 */

var Minitel = Minitel || {}

/**
 * @class Stream
 */
Minitel.Stream = class {

    /**
     * Constructor
     */
    constructor() {
        this.reset()
    }

    /**
     * Reset the stream
     */
    reset() {
        /**
         * An array of integer codes
         * @member {number[]}
         */
        this.items = []
        this.length = 0
    }

    /**
     * 
     * @param item Any value to insert in the queue.
     */
    push(item) {
        if(item === null || item === undefined) return

        if(item instanceof Minitel.Stream) {
            // Stream
            this.items = this.items.concat(item.items)
        } else if(typeof item === "string" && item.length === 1) {
            // String
            this._pushValue(item.charCodeAt(0))
        } else if(typeof item[Symbol.iterator] === "function") {
            // Iterable object
            for(let value of item) this.push(value)
        } else if(typeof item === "number") {
            // Number
            this._pushValue(item)
        }
        this.length = this.items.length
    }

    /**
     * In
     * @param value {number} An integer value to insert in the queue
     * @private
     */
    _pushValue(value) {
        value = parseInt(value)

        if(Minitel.specialChars[value]) {
            // Convert special characters to Minitel codes
            Minitel.specialChars[value].map(v => this.items.push(v))
        } else if(value > 0x7f) {
            // Minitel does not understand values above 0x7f 
            return
        } else {
            this.items.push(value)
        }
    }

    /**
     * The shift method
     */
    shift() {
        this.length--
        return this.items.shift()
    }

    /**
     * The pop method
     */
    pop() {
        this.length--
        return this.items.pop()
    }

    /**
     * Generates a trimmed version of the current stream by removing every
     * control codes. It won't properly work when used on anything else than a
     * row.
     * @return {Stream} The trimmed version of the current stream
     */
    trimRow() {
        let lastChar = -1
        for(let i = 0; i < this.length; i++) {
            if(this.items[i] >= 0x20) {
                lastChar = i
                continue
            }

            if(this.items[i] === 0x12) {
                i++
                lastChar = i
                continue
            }

            if(this.items[i] === 0x1b) i++
            if(this.items[i] === 0x1f) i+= 2
        }

        const trimmed = new Minitel.Stream()
        trimmed.push(this.items.slice(0, lastChar + 1))

        return trimmed
    }

    /**
     * Generates an optimized version of the current stream. It won't properly
     * work when used on anything else than a row.
     * @return {Stream} An optimized version of the current stream
     */
    optimizeRow() {
        let bg = 0x50
        let fg = 0x47
        let separated = false
        let char = 0x00
        let count = 0

        const optimized = new Minitel.Stream()
        for(let i = 0; i < this.length; i++) {
            let moveRight = this.items[i] === 0x09
            let chgFG = this.items[i] === 0x1b
                     && this.items[i + 1] >= 0x40
                     && this.items[i + 1] <= 0x47
                     && this.items[i + 1] !== fg
            let chgBG = this.items[i] === 0x1b
                     && this.items[i + 1] >= 0x50
                     && this.items[i + 1] <= 0x57
                     && this.items[i + 1] !== bg
            let chgSep = this.items[i] === 0x1b
                      && (   (this.items[i + 1] === 0x5a && !separated)
                          || (this.items[i + 1] === 0x59 && separated))
            let chgChar = this.items[i] >= 0x20 && this.items[i] !== char

            const anyChange = moveRight || chgFG || chgBG || chgSep || chgChar

            if(count > 0 && anyChange) {
                if(count == 1) {
                    optimized.push(char)
                } else {
                    optimized.push([0x12, 0x40 + count])
                }
                count = 0
            }

            if(moveRight) {
                optimized.push(0x09)
            } else if(chgFG) {
                // Change foreground color
                fg = this.items[i + 1]
                optimized.push([0x1b, fg])
            } else if(chgBG) {
                // Change background color
                bg = this.items[i + 1]
                optimized.push([0x1b, bg])
            } else if(chgSep) {
                // Change separated
                separated = !separated
                optimized.push([0x1b, this.items[i + 1]])
            } else if(chgChar) {
                // Change character
                optimized.push(this.items[i])
                char = this.items[i]
            } else if(this.items[i] >= 0x20) {
                // Same character
                count++
            } else if(this.items[i] !== 0x1b) {
                optimized.push(this.items[i])
            }

            if(this.items[i] === 0x1b) i++
        }
        if(count > 0) optimized.push([0x12, 0x40 + count])

        return optimized
    }
}

