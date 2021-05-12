export default class ScrollSnap {
    constructor(duration = 1000, reduceRedundant = true, logOutput = false) {
        this.duration = duration;
        this.logOutput = logOutput;

        this.idle = true;
        this.blocked = false;

        this.wheelEventCallback = function (event) {
            event.preventDefault();
            if (!this.idle) {
                return;
            } else {
                this.idle = false;
            }
            if (!this.blocked) {
                this.snaps.filter(snap => !snap.disabled).some((snap, i, arr) => {
                    let distance = snap.getDistance();
                    let chosen = (i === arr.length - 1) ?
                        true
                        : Math.abs(distance) < Math.abs(arr[i + 1].getDistance());
                    if (chosen) {
                        this.log(`Nearest: Element at index-${snap.index}, ${
                            snap.top ? "top" : "bottom"
                        }, distance: ${distance}`);
                        this.log(`Registered scroll: ${event.deltaY}`);
                        if (
                            (distance > 0 && (distance - event.deltaY) <= 0)
                            || (distance < 0 && (distance - event.deltaY) >= 0)
                        ) {
                            this.log(
                                `Hitting snapping point at index-${snap.index} - ${snap.top ? "top" : "bottom"}.`, 1
                            );
                            this.log("Aligning scrolling position to element.");
                            window.scrollBy(event.deltaX, distance);
                            this.log(`Blocking wheel event by ${this.duration}ms.`);
                            this.blocked = true;
                            setTimeout(() => {
                                this.blocked = false;
                                this.log("Wheel event unblocked.");
                            }, this.duration);
                        } else {
                            this.log("Passing through the wheel event.");
                            window.scrollBy(event.deltaX, event.deltaY);
                        }
                    }
                    return chosen;
                });
            }
            this.idle = true;
        }.bind(this);

        this.snaps = [];
        document.querySelectorAll("[data-scroll-snap]").forEach(el => {
            el.dataset.scrollSnap.split(",").forEach((edge) => {
                switch (edge) {
                    case "top":
                        this.snaps.push({
                            element: el,
                            disabled: false,
                            top: true,
                            getDistance: () => el.getBoundingClientRect().top,
                        });
                        break;
                    case "bottom":
                        this.snaps.push({
                            element: el,
                            disabled: false,
                            top: false,
                            getDistance: () => el.getBoundingClientRect().bottom,
                        });
                        break;
                }
            });
        });
        this.snaps.forEach((snap, i) => {
            Object.assign(snap, {index: i});
        });
        if (reduceRedundant) {
            this.reduceRedundant();
        } else {
            this.sort();
        }

        this.toggle(true);
    }

    sort() {
        this.log("Sorting items.")
        this.snaps.sort((a, b) => {
            return (a.element.offsetTop + (a.top ? 0 : a.element.offsetHeight))
                - (b.element.offsetTop + (b.top ? 0 : b.element.offsetHeight));
        });
    }

    reduceRedundant() {
        this.sort();
        let lastItemHeight;
        this.snaps.forEach((snap, i, arr) => {
            let itemHeight = snap.element.offsetTop + (snap.top ? 0 : snap.element.offsetHeight);
            if (i === 0) {
                if (snap.top && (snap.element.offsetTop === 0)) {
                    snap.disabled = true;
                    this.log("Item 0 is disabled due to it’s position (top of the document).");
                }
            } else {
                if (
                    i === arr.length - 1
                    && !snap.top
                    && snap.element.offsetTop + snap.element.offsetHeight === document.body.scrollHeight
                ) {
                    snap.disabled = true;
                    this.log(`Item ${i} is disabled due to it's position (bottom of the document).`);
                } else {
                    let disabled = itemHeight === lastItemHeight;
                    snap.disabled = disabled;
                    this.log(`Item ${i} is ${disabled ? "disabled due to overlapping" : "enabled"}.`);
                }
            }
            lastItemHeight = itemHeight;
        });
        this.log(`${this.snaps.filter(snap => !snap.disabled).length} items valid after reducing.`);
    }

    toggle(enabled) {
        if (enabled) {
            window.addEventListener("wheel", this.wheelEventCallback, {passive: false});
        } else {
            window.removeEventListener("wheel", this.wheelEventCallback);
        }
    }

    log(message, level = 0) {
        if (this.logOutput) {
            switch (level) {
                case 1:
                    console.warn("ScrollSnapJS: " + message);
                    break;
                case 2:
                    console.error("ScrollSnapJS: " + message);
                    break;
                default:
                    console.log("ScrollSnapJS: " + message);
            }
        }
    }
}
