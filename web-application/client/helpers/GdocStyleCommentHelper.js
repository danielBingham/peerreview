
/**
 * A dictionary, keyed by thread.id, containing the thread's Bounding Client
 * Rect and Style parameters, as well as a boolean indicating whether the
 * thread should be collapsed or not.
 *
 * Structure:
 * ```
 * {
 *  id: {
 *      rect: {},
 *      style: {},
 *      collapsed: false,
 *      selected: false
 *      }
 * }
 * ```
 */
let threadInfo = null 

const logThreads = function(threads, infoToLog) {
    if ( ! infoToLog ) {
        console.log("Info is null.")
        return
    }
    for(let index = 0; index < threads.length; index++) {
        const thread = threads[index]

        const info = infoToLog[thread.id]
        console.log(`Rect for Thread(${thread.id}) - [ top:${info.rect.top}, left: ${info.rect.left} ], ( height: ${info.rect.height}, width: ${info.rect.width} )`)
    }
}

/** 
 * Reflow and reposition the threads.  
 *
 * Must be called after React has run it's render (so from a useEffect()
 * and not a useLayoutEffect().
 *
 * @return {int} The number of theads that were collapsed.
 */
export const reflowThreads = function(threads, centeredThreadId, shouldFocus) {
    // NOTE: This positioning algorithm assumes that `threads` has been
    // sorted and the threads are in the order they appear on the document,
    // from top to bottom.
    populateThreadInfo(threads) 
    alignThreadsWithPins(threads)

    const centeredIndex = threads.findIndex((t) => t.id == centeredThreadId)
    console.log(centeredIndex)
    if (centeredThreadId !== null && centeredIndex !== -1) {
        spreadThreadsFromThread(threads, centeredThreadId)
    } else {
        spreadThreadsFromTop(threads)
    }

    return positionThreads(threads, shouldFocus)
}

const populateThreadInfo = function(threads) {
    threadInfo = {}

    for(let index = 0; index < threads.length; index++) {
        const thread = threads[index]

        // Mostly using this just for height and width.
        const threadElement = document.getElementById(`thread-${thread.id}-wrapper`)

        // Reset the thread before we retrieve the bounding box.
        threadElement.classList.remove('collapsed')
        threadElement.classList.remove('selected')

        const rect = threadElement.getBoundingClientRect()
        threadInfo[thread.id] = {
            rect: {
                top: 0,
                left: 0,
                height: rect.height,
                width: rect.width
            },
            collapsed: false,
            selected: false
        }
    }

}

/**
 * Align each thread on its document pin, allowing threads to overlap.
 *
 * This is used to do the initial positioning of the threads, before
 * spreading them in someway to remove the overlap.
 *
 * NOTE: This method must be called before either of the spread methods is used.
 */
const alignThreadsWithPins = function(threads) {
    // Initial positioning.
    for(let index = 0; index < threads.length; index++) {
        centerThreadOnPin(threads[index])
    }
}

/**
 * Center a single thread on its document pin.  Optionally highlight it as
 * the selected thread.
 *
 * NOTE: This will clear any thread collapsing.
 *
 * @param {Object} thread   The thread object of the thread we'd like to center.
 * @param {boolean} highlight   (Optional) If set to true, the centered
 * thread will be "selected".
 *
 * @return {void}
 */
const centerThreadOnPin = function(thread, highlight) {
    console.log(thread)
    const documentElement = document.getElementsByClassName(`paper-pdf-document`)[0]
    if ( ! documentElement ) {
        return
    }
    const documentRect = documentElement.getBoundingClientRect()

    const pageElement = document.getElementById(`paper-pdf-page-${thread.page}`)
    if ( ! pageElement ) {
        // We must be running outside the render loop somehow.  Bail out.
        return
    }
    const pageRect = pageElement.getBoundingClientRect()

    threadInfo[thread.id].rect.top = (pageRect.top - documentRect.top) + pageRect.height*thread.pinY - 50
    threadInfo[thread.id].rect.left = pageRect.width + 5
    threadInfo[thread.id].collapsed = false
    if ( highlight ) {
        threadInfo[thread.id].selected = true
    }
}


/**
 * Flow thread down from the top of the document.
 *
 * Spreads threads out starting from the top of the document.  The top
 * thread is placed even with the top of the document and threads are
 * pushed down from there to avoid overlap.
 *
 * Assumes threads have already been aligned with their pins, since it
 * checks their actual positioning to detect collisions.
 *
 * @return {void}
 */
const spreadThreadsFromTop = function(threads) {
    // Repositioning to account for collisions.
    for(let index = 0; index < threads.length; index++) {
        const thread = threads[index]
        const threadAbove = index >= 1 ? threads[index-1] : null

        if ( threadAbove ) {
            const rect = threadInfo[thread.id].rect
            const rectAbove = threadInfo[threadAbove.id].rect

            if ( rect.top <= rectAbove.top + rectAbove.height + 5) {
                rect.top = ((rectAbove.top + rectAbove.height) + 10) 
            }
        }
    }
}

/**
 * Flow threads out from a centered thread.
 *
 * Takes a threadId, centers the thread identified by the id and then
 * spreads out threads above and below it to avoid overlap.  Threads above
 * are pushed up, threads below are pushed down.
 *
 * Assumes threads have already been aligned with their pins, since it
 * checks their actual positioning to detect collisions.
 *
 * @param {int} threadId    The id number of the thread we want to center.
 *
 * @return {void}
 */
const spreadThreadsFromThread = function(threads, threadId) {
    const centeredIndex = threads.findIndex((t) => t.id == threadId)

    // Center the comment.
    centerThreadOnPin(threads[centeredIndex], true)

    // Walk up from the centered comment.
    for(let index = centeredIndex; index >= 0; index--) {
        const thread = threads[index]
        const threadAbove = index >= 1 ? threads[index-1] : null

        if ( threadAbove !== null) {
            const rect = threadInfo[thread.id].rect 
            const rectAbove = threadInfo[threadAbove.id].rect 

            if ( rect.top <= rectAbove.top + rectAbove.height + 5) {
                rectAbove.top = (rect.top - rectAbove.height - 10) 
                if ( rectAbove.top < 0 ) {
                    threadInfo[threadAbove.id].collapsed = true 
                } 
            }
        }

    }

    // Walk down from the centered comment.
    for(let index = centeredIndex+1; index < threads.length; index++) {
        const thread = threads[index]
        const threadAbove = index >= 1 ? threads[index-1] : null

        if ( threadAbove !== null ) {
            const rect = threadInfo[thread.id].rect 
            const rectAbove = threadInfo[threadAbove.id].rect 

            if ( rect.top <= rectAbove.top + rectAbove.height + 5) {
                rect.top = ((rectAbove.top + rectAbove.height) + 10)
            }
        }

    }
}

const positionThreads = function(threads, shouldFocus) {
    let numberOfCollapsedThreads = 0
    for(let index = 0; index < threads.length; index++) {
        const thread = threads[index]
        const info = threadInfo[thread.id]

        const threadElement = document.getElementById(`thread-${thread.id}-wrapper`)
        const newTop = parseInt(info.rect.top) + 'px'
        const newLeft = parseInt(info.rect.left) + 'px'

        threadElement.style.top = newTop 
        threadElement.style.left = newLeft 

        if ( info.collapsed ) {
            numberOfCollapsedThreads += 1
            threadElement.classList.add('collapsed')
        } else {
            threadElement.classList.remove('collapsed')
        }

        if ( info.selected ) {
            threadElement.classList.add('selected')
            if ( shouldFocus) { 
                threadElement.addEventListener("transitionend", function() {
                    // Focus the current form only after the transition has
                    // completed to ensure we don't bounce the screen around.
                    threadElement.querySelector(`textarea`)?.focus()
                }, { once: true })
            }
        } else {
            threadElement.classList.remove('selected')
        }
    }
    return numberOfCollapsedThreads
}
