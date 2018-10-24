"use strict";
import {Component} from "//unpkg.com/can@5/core.min.mjs";

const release = "2.5";          // "Semantic" program version for end users
document.title = "CanJS Color Chooser " + release;

///// Set up responsive sizing of all elements by executing our CSS via JavaScript:

const gridCellSize = 45;
const bodyMargin = 40;
let baseColSpec;
let finalColSpec;

// Demo mode:
let demoSecs = 0;   // For frames/sec readout
let frameCount = 0;

let doDemo = false;
let demoRefreshing = false;
let demoBaseArray = [];  // Copy of baseArray For "demo" mode operation
let demoSpeed = 10; // ms delay during demo cycles
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('demo')) {
    if (urlParams.get('demo') === 'true')
        doDemo = true;
}

setMySize();
window.addEventListener('resize', setMySize);

function setMySize() {
    const myWidth = document.documentElement.clientWidth - bodyMargin * 2; // account for margins
    const myHeight = document.documentElement.clientHeight - bodyMargin * 2; // margins + other elements

    // "final" grid dimensions:
    const finalWidth = myWidth - 145;   // Allow for readout grid
    const finalHeight = myHeight - 185; // Allow for base grid
    const finalMinDim = finalWidth < finalHeight ? finalWidth : finalHeight;

    baseColSpec = Math.round(myWidth / gridCellSize);
    finalColSpec = Math.round(finalMinDim / gridCellSize);
    if (finalColSpec < 2) finalColSpec = 2;
    demoSecs = 0;
    frameCount = 0;

    /// Write style sheet from here so we can use its variables in our JavaScript:
    let styleEl = document.getElementById("ccStyles"); // Avoid appending multiple <style>s
    if (styleEl)
        styleEl.parentNode.removeChild(styleEl);
    const ccStyleSheet = document.createElement('style');
    ccStyleSheet.id = "ccStyles";
    ccStyleSheet.innerHTML = `
:root {
    font-family: sans-serif;
    --bgcolor: lightgray;
    background-color: var(--bgcolor);
}

body {
    margin: ${bodyMargin}px;
}

h1 {
    text-align: center;
}

#baseColors {
    display: grid;
    width: fit-content;
    grid-template-columns: repeat(${baseColSpec}, ${gridCellSize}px);
}

#finalColors {
    display: inline-grid;
    width: fit-content;
    grid-template-columns: repeat(${finalColSpec}, ${gridCellSize}px); /* best w/odd number */
}

#readout-grid {
    display: inline-grid;
    grid-template-columns: ${gridCellSize * 2}px ${gridCellSize * 2}px;
    max-width: ${gridCellSize * 2}px; /* scroll screen instead of wrapping beneath elements to my left */
}

.base-el, .final-el {
    border-color: var(--bgcolor);
    border-style: solid;
    border-width: 2px;
}

.base-el, .final-el, .selected {
    font-size: ${gridCellSize / 4}px;
    line-height: ${gridCellSize / 4}px;
    /*border-radius: ${gridCellSize / 8}px; causes lockups (performance) */
    height: ${gridCellSize / 1.1}px;
    display: block;
    cursor: pointer;
    padding-left: ${gridCellSize / 20}px;
    padding-top: ${gridCellSize / 20}px;
}

.info {
    font-size: ${gridCellSize / 3.5}px;
    text-align: right;
    padding: 6px;
}

@keyframes blink {
    0% {
        border: 2px inset white;
    }
    100% {
        border: 2px outset white;
    }
}

/* Highlight a selected cell */
.selected {
    animation: blink .6s step-start infinite alternate;
    animation-timing-function: ease-in-out;
    /*todo: causes lockup w/Chrome ("mousehandler timeout?") */
    /*transform: skewY(-20deg);*/
}

button {
    height: ${gridCellSize * 2}px;
    width: ${gridCellSize * 2}px;
    font-size: ${gridCellSize / 3.5}px;
    line-height: ${gridCellSize / 3.5}px;
    align-self: center;
    cursor: pointer;
    border: 3px solid gray;
}

button:hover,
button:focus {
    background: white;
}

button:active {
  transform: translate(4px, 4px);
}
`;

    document.head.appendChild(ccStyleSheet);
}

Component.extend({
    tag: "color-chooser",
    view: `
        <h1>CanJS Color Chooser ${release}</h1>
		<div><b>Click to lock base color</b> 
			<span style="{{colorStyle(baseOrSuggestedColor)}}">
				{{printShortColor(baseOrSuggestedColor)}}
			</span>
		</div>
		
		<div id="baseColors">
			{{#for(color of baseColors)}}
				<span style="{{colorStyle(color)}}" 
					on:mouseenter="hoverBaseColor(color)"
					on:click="clickBaseColor(color)"
					{{#eq(color, suggestedBaseColor)}}class="selected"{{else}}class="base-el"{{/eq}}>
					{{{printLongColor(color)}}}
				</span>
			{{/for}}
			<br>
		</div>
		<div class='clear'>
			<b>Click to lock final color</b>
			<span style="{{colorStyle(finalOrBaseOrSuggestedColor)}}">
				{{printShortColor(finalOrBaseOrSuggestedColor)}}
			</span>
		</div>
		<div id="finalColors">
			{{#for(color of finalColors)}}
				<span style="{{colorStyle(color)}}" 
					on:mouseenter="hoverFinalColor(color)"
					on:click="clickFinalColor(color)"
					{{#eq(color, suggestedFinalColor)}}class="selected"{{else}}class="final-el"{{/eq}}>
					{{{printLongColor(color)}}}
				</span>
			{{/for}}
		</div>
		<div id="readout-grid">
		    <span class=info><b>Final<br>Color:</b></span>
		    <span style="{{colorStyle(finalOrBaseOrSuggestedColor)}} padding: 12px; border: 3px solid gray;">
			{{{printLongColor(finalOrBaseOrSuggestedColor)}}}
			</span>
			<span></span>
			<span></span>
			<span></span>
            <button on:click=copyToClip({{printShortColor(finalOrBaseOrSuggestedColor)}})>
            Copy <br><b>{{printShortColor(finalOrBaseOrSuggestedColor)}}</b><br> to clipboard</button>
  		    <span class=info>{{#if(clipCopied)}}<b>{{clipCopied}}</b> copied to clipboard.{{else}}<br><br><br>{{/if}}</span>

		    <!-- Quotes coerce non-numeric to string for copyToClip(): -->
            <button on:click=copyToClip(\"{{printHexColor(finalOrBaseOrSuggestedColor)}}\")>
            Copy <br><b>{{printHexColor(finalOrBaseOrSuggestedColor)}}</b><br> to clipboard</button>
            <span></span>
            <span></span>
            <span class=info>{{#if(framesPerSec)}}Average frames/sec:
                <b>{{framesPerSec}}@{{finalCols}}x{{finalCols}}</b>{{/if}}</span>
            <button on:click="toggleDemo()">
                Demo {{demoButton}}</button>
		</div>
	`,
    ViewModel: {
        // STATEFUL PROPS
        suggestedBaseColor: "any",
        baseColor: "any",
        suggestedFinalColor: "any",
        finalColor: "any",
        clipCopied: {default: 0},
        framesPerSec: {default: 0},
        baseCols: {default: baseColSpec},
        finalCols: {default: finalColSpec},
        // finalArray: undefined, // not "watched" if declared as "undefined" (why?)
        finalArray: "any", // stateful so we can watch it during demo mode
        demoButton: {default: "ON"},

        // DERIVED VALUES
        get baseColors() {
            // const sinFreq = .3;
            const sinFreq = 6 / this.baseCols;
            const greenPhase = 2 * Math.PI / 3;
            const bluePhase = 4 * Math.PI / 3;
            const sineWidth = 127;
            const sineCtr = 128;
            const colors = [];
            for (let j = 0; j < this.baseCols - 1; ++j) {
                var red = Math.round(Math.sin(sinFreq * j + 0) * sineWidth + sineCtr);
                var grn = Math.round(Math.sin(sinFreq * j + greenPhase) * sineWidth + sineCtr);
                var blu = Math.round(Math.sin(sinFreq * j + bluePhase) * sineWidth + sineCtr);
                colors.push({red, grn, blu})
            }
            // Add gray square:
            red = grn = blu = 127;
            colors.push({red, grn, blu});
            demoBaseArray = colors;
            return colors;
        },
        get baseOrSuggestedColor() {
            return this.baseColor || this.suggestedBaseColor || this.baseColors[this.baseCols - 1];
        },
        get finalOrBaseOrSuggestedColor() {
            return this.finalColor || this.suggestedFinalColor || this.baseOrSuggestedColor;
        },
        get finalColors() {
            let colorArray = [];
            // this.finalArray = [];
            let red;
            let grn;
            let blu;
            let xOffset;
            let yOffset;
            let xSpread = Math.round(136 / this.finalCols);
            let ySpread = Math.round(154 / this.finalCols);
            let periphCols = Math.trunc(this.finalCols / 2);
            for (let c = 0; c < this.finalCols; c++) {
                for (let r = 0; r < this.finalCols; r++) {
                    xOffset = periphCols - c;    // How far am I from grid center?
                    yOffset = periphCols - r;
                    // Purely empirical way of getting a useful range:
                    red = this.baseOrSuggestedColor.red + xOffset * xSpread + yOffset * ySpread;
                    grn = this.baseOrSuggestedColor.grn + xOffset * xSpread + yOffset * ySpread;
                    blu = this.baseOrSuggestedColor.blu + xOffset * xSpread + yOffset * ySpread;
                    red = red > 255 ? 255 : red < 1 ? 0 : red;
                    grn = grn > 255 ? 255 : grn < 1 ? 0 : grn;
                    blu = blu > 255 ? 255 : blu < 1 ? 0 : blu;
                    // this.finalArray.push({red, grn, blu}) // causes performance issues (fix CanJS?)
                    colorArray.push({red, grn, blu})
                }
            }
            // return this.finalArray;
            this.finalArray = colorArray;
            return colorArray;
        },
        // HELPER METHODS
        colorStyle(color) {
            if (color.red + color.grn * 1.5 + color.blu * .5 > 400)  // '+' coerces strings to numbers

                return `color: black; background-color: rgb(${color.red},${color.grn},${color.blu});`
            else
                return `color: white; background-color: rgb(${color.red},${color.grn},${color.blu});`
        },
        printShortColor(color) {
            return `${color.red},${color.grn},${color.blu}`;
        },
        printHexColor(color) {
            let redHex = color.red.toString(16).padStart(2, "0");
            let grnHex = color.grn.toString(16).padStart(2, "0");
            let bluHex = color.blu.toString(16).padStart(2, "0");
            return `#${redHex}${grnHex}${bluHex}`;
        },
        printLongColor(color) {
            return `R:${color.red}<br>G:${color.grn}<br>B:${color.blu}`
        },

        // METHODS THAT CHANGE STATE
        hoverBaseColor(color) {
            if (doDemo) return;
            if (!this.baseColor)
                this.suggestedBaseColor = color;
        },
        clickBaseColor(color) {
            if (doDemo) return;
            if (this.baseColor) {
                this.baseColor = null;
                this.suggestedBaseColor = color;
            }
            else {
                this.baseColor = color;
                // There are less imperative ways of doing this
                this.suggestedFinalColor = null;
                this.finalColor = null;
            }
        },
        hoverFinalColor(color) {
            if (doDemo) return;
            if (!this.finalColor)
                this.suggestedFinalColor = color;
        },
        clickFinalColor(color) {
            if (doDemo) return;
            if (this.finalColor) {
                this.finalColor = null;
                this.suggestedFinalColor = color;
            }
            else {
                this.finalColor = color;
                this.suggestedFinalColor = color;
            }
        },
        // Copy argument(s) to end user system's clipboard:
        copyToClip(...clipStrings) {
            let textArea = document.createElement("textarea");
            textArea.value = clipStrings;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("Copy");
            textArea.remove();
            this.clipCopied = `${clipStrings}`;
        },
        // Methods related to "demo" mode.  Strategy is:
        // - runDemo() changes suggestedBaseColor to a random selection
        //      - change to suggestedBaseColor triggers random change to suggestedFinalColor
        //          - change to suggestedFinalColor triggers runDemo() and the cycle repeats.
        runDemo() {
            let nextBaseEl;

            do
                nextBaseEl = demoBaseArray[Math.trunc(Math.random() * baseColSpec)];
            while (nextBaseEl === this.suggestedBaseColor); // Force new random location

            setTimeout(() => {
                if (doDemo) {   // Test flag here since it may have been cleared during timeout
                    this.suggestedBaseColor = nextBaseEl;  // Trigger update of final grid
                }
                demoRefreshing = false;
                }, demoSpeed);
        },
        clockDemo() {
            setTimeout(() => {
                if (doDemo) {
                    this.framesPerSec = (frameCount / ++demoSecs).toFixed(2); // Seconds we have been running this demo}
                    this.clockDemo();
                }
            }, 1000);
        },
        toggleDemo() {
            doDemo = !doDemo;
            if (doDemo) {
                demoRefreshing = false;
                this.demoButton = "OFF";
                this.clockDemo();
                this.runDemo();     // Kick off demo
            } else {
                this.demoButton = "ON";
                frameCount = 0;
                demoSecs = 0;
            }
        }
    },
    events: {
        "{window} resize":
            function () {
                // console.log('resize event.');
                this.viewModel.suggestedBaseColor = null;
                this.viewModel.baseColor = null;
                this.viewModel.suggestedFinalColor = null;
                this.viewModel.finalColor = null;
                this.viewModel.baseCols = baseColSpec;
                this.viewModel.finalCols = finalColSpec;
            },
        "{viewModel} finalArray":
        // finalArray update triggered by runDemo(); now select a color from it
            function (viewModel, event, newValue) {
                if (doDemo) {
                    // console.log("finalArray triggered demo update.");
                    let nextFinalEl;
                    const finalCellCt = this.viewModel.finalCols * this.viewModel.finalCols;

                    do
                        nextFinalEl = this.viewModel.finalArray[Math.trunc(Math.random() * finalCellCt)];
                    while (nextFinalEl === this.viewModel.finalColor); // Force new random location

                    this.viewModel.suggestedFinalColor = nextFinalEl;
                    frameCount++;
                }
            },
        "{viewModel} suggestedFinalColor":
        // suggestedFinalColor changed due to finalArray update (above); now restart runDemo()
            function (viewModel, event, newValue) {
                doDemo && this.viewModel.runDemo();
            }
    }
});
