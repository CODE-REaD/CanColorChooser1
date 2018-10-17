"use strict";
import {Component} from "//unpkg.com/can@5/core.min.mjs";
const release = "2.5";          // "Semantic" program version for end users
document.title = "CanJS Color Chooser " + release;

///// Set up responsive sizing of all elements by executing our CSS via JavaScript:

const gridCellSize = 45;
const bodyMargin = 40;
let baseColSpec;
let finalColSpec;

setMySize();
window.addEventListener('resize', setMySize);

function setMySize() {
    const myWidth = document.documentElement.clientWidth - bodyMargin * 2; // account for margins
    const myHeight = document.documentElement.clientHeight - bodyMargin * 2; // margins + other elements
    const finalWidth = myWidth - 135;
    const finalHeight = myHeight - 175;
    const finalMinDim = finalWidth < finalHeight ? finalWidth : finalHeight;
    baseColSpec = Math.round(myWidth / gridCellSize);
    finalColSpec = Math.round(finalMinDim / gridCellSize);

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
    grid-template-columns: ${gridCellSize * 1.2}px ${gridCellSize * 2}px;
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

@keyframes blink {
    0% {
        border: 2px solid white;
    }
    100% {
        border: 2px solid black;
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
    width: ${gridCellSize * 3}px;
    font-size: ${gridCellSize / 3}px;
    line-height: ${gridCellSize / 3}px;
    align-self: center;
    cursor: pointer;
    border: 3px solid gray;
}

button:hover,
button:focus {
    background: white;
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
		    <span style="text-align: right; padding: 6px"><b>Final<br>Color:</b></span>
		    <span style="{{colorStyle(finalOrBaseOrSuggestedColor)}} padding: 12px; border: 3px solid gray;">
			{{{printLongColor(finalOrBaseOrSuggestedColor)}}}
			</span>
			<span></span>
			<span></span>
			<span></span>
            <button on:click=copyToClip({{printShortColor(finalOrBaseOrSuggestedColor)}})>
            Copy <b>{{printShortColor(finalOrBaseOrSuggestedColor)}}</b> to clipboard</button>
            <span></span>
            <span></span>
            <span></span>
		    <!-- Quotes coerce non-numeric to string for copyToClip(): -->
            <button on:click=copyToClip(\"{{printHexColor(finalOrBaseOrSuggestedColor)}}\")>
            Copy <b>{{printHexColor(finalOrBaseOrSuggestedColor)}}</b> to clipboard</button>
            <span></span><span></span>
		    <span style="padding: 12px; grid-column: 2 / 3">{{#if(clipCopied)}}<b>{{clipCopied}}</b> copied to clipboard.{{/if}}</span>
		</div>
	`,
    ViewModel: {
        // STATEFUL PROPS
        suggestedBaseColor: "any",
        baseColor: "any",
        suggestedFinalColor: "any",
        finalColor: "any",
        clipCopied: "any",
        baseCols: {default: baseColSpec},
        finalCols: {default: finalColSpec},

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
                    colorArray.push({red, grn, blu})
                }
            }
            return colorArray;
        },
        // HELPER METHODS
        colorStyle(color) {
            if (color.red + color.grn + color.blu > 400)
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
            if (!this.baseColor)
                this.suggestedBaseColor = color;
        },
        clickBaseColor(color) {
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
            if (!this.finalColor)
                this.suggestedFinalColor = color;
        },
        clickFinalColor(color) {
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
    },
    events: {
        '{window} resize': function () {
            this.suggestedBaseColor = null;
            this.baseColor = null;
            this.suggestedFinalColor = null;
            this.finalColor = null;
            this.viewModel.baseCols = baseColSpec;
            this.viewModel.finalCols = finalColSpec;
        }
    }
});
