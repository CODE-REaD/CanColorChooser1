// import {Component} from "//unpkg.com/can@5/core.mjs";
import {Component} from "//unpkg.com/can@5/core.min.mjs";

const release = "2.2";          // "Semantic" program version for end users
document.title = "CanJS Color Chooser " + release;

const gridCellSize = 45;
let baseCols;
let finalColSpec;

setWidth();
window.addEventListener('resize', setWidth);

function setWidth() {
    const winWidth = document.documentElement.clientWidth;
    // const gridCellSize = Math.round(winWidth / 21);
    baseCols = Math.round(winWidth / 50);
    finalColSpec = Math.round(winWidth / 80);
    console.log(`winWidth set to ${winWidth}, baseCols set to ${baseCols}, finalColSpec set to ${finalColSpec}`);

    /// Write style sheet from here so we can use its variables in our JavaScript:
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `

 :root {
     font-family: sans-serif;
     --bgcolor: lightgray;
     background-color: var(--bgcolor);
 }

body {
    margin: 10px;
}

h1 {
    text-align: center;
}

#outmost-div {
    width: 95%;
    margin-left: auto;
    margin-right: auto;
}

#baseColors {
    display: grid;
    width: fit-content;
    grid-template-columns: repeat(${baseCols}, ${gridCellSize}px);
}

#finalColors {
    display: inline-grid;
    width: fit-content;
    grid-template-columns: repeat(${finalColSpec}, ${gridCellSize}px); /* best w/odd number */
}

#readout-grid {
    display: inline-grid;
    width: fit-content;
    grid-template-columns: repeat(3, ${gridCellSize * 4}px);
    height: ${gridCellSize * 6};
    max-width: 70px; /* scroll screen instead of wrapping beneath elements to my left */
}

base-el, final-el {
    font-size: ${gridCellSize / 4}px;
    line-height: ${gridCellSize / 4}px;
    /*border-radius: ${gridCellSize / 8}px; causes lockups (performance) */
    height: ${gridCellSize / 1.1}px;
    display: block;
    color: white;
    border-color: var(--bgcolor);
    border-style: solid;
    border-width: 2px;
    cursor: pointer;
    padding-left: ${gridCellSize / 20}px;
    padding-top: ${gridCellSize} / 20}px;
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

.notSelected {
}

button {
    height: ${gridCellSize * 2}px;
    width: ${gridCellSize * 3}px;
    font-size: ${gridCellSize / 3}px;
    line-height: ${gridCellSize / 3}px;

/*    width: 100px;
    height: 70px;*/
    align-self: center;
    cursor: pointer;
    border: 3px solid gray;
}

button:hover,
button:focus {
    background: white;
}
`;
    document.head.appendChild(styleSheet);
}

Component.extend({
    tag: "color-chooser",
    view: `
    <div id="outmost-div">
        <h1>CanJS Color Chooser ${release}</h1>
		<div>Click to lock base color 
			<span style="{{colorStyle(this.baseOrSuggestedColor)}}">
				{{printShortColor(this.baseOrSuggestedColor)}}
			</span>
		</div>
		
		<div id="baseColors">
			{{#for(color of this.baseColors)}}
				<base-el style="{{colorStyle(color)}}" 
					on:mouseenter="hoverBaseColor(color)"
					on:click="clickBaseColor(color)"
					{{#eq(color, suggestedBaseColor)}}class='selected'{{/eq}}>
					{{{printLongColor(color)}}}
				</base-el>
			{{/for}}
			<br>
		</div>
		<div class='clear'>
			Click to lock final color
			<span style="{{colorStyle(this.finalOrBaseOrSuggestedColor)}}">
				{{printShortColor(this.finalOrBaseOrSuggestedColor)}}
			</span>
		</div>
		<div id="finalColors">
			{{#for(color of this.finalColors)}}
				<final-el style="{{colorStyle(color)}}" 
					on:mouseenter="hoverFinalColor(color)"
					on:click="clickFinalColor(color)"
					{{#eq(color,this.suggestedFinalColor)}}class='selected'{{/eq}}>
					{{{printLongColor(color)}}}
				</final-el>
			{{/for}}
		</div>
		<span id="readout-grid">
		    <span style="text-align: right; padding: 6px"><b>Final<br>Color:</b></span>
		    <span style="{{colorStyle(this.finalOrBaseOrSuggestedColor)}} padding: 12px; border: 3px solid gray;">
			{{{printLongColor(this.finalOrBaseOrSuggestedColor)}}}
			</span>
		    <span style="padding: 12px">{{#if(this.clipCopied)}}<b>{{this.clipCopied}}</b> copied to clipboard.{{/if}}</span>
		    <span />
            <button on:click=copyToClip({{printShortColor(this.finalOrBaseOrSuggestedColor)}})>
            Copy <b>{{printShortColor(this.finalOrBaseOrSuggestedColor)}}</b> to clipboard</button>
		    <!-- Quotes coerce non-numeric to string for copyToClip(): -->
            <button on:click=copyToClip(\"{{printHexColor(this.finalOrBaseOrSuggestedColor)}}\")>
            Copy <b>{{printHexColor(this.finalOrBaseOrSuggestedColor)}}</b> to clipboard</button>
		</span>
	</div>
	`,
    ViewModel: {
        // STATEFUL PROPS
        suggestedBaseColor: "any",
        baseColor: "any",
        suggestedFinalColor: "any",
        finalColor: "any",
        clipCopied: "any",
        finalCols: { default: finalColSpec },

        // DERIVED VALUES
        get baseColors() {
            const sinFreq = .3;
            const greenPhase = 2 * Math.PI / 3;
            const bluePhase = 4 * Math.PI / 3;
            const sineWidth = 127;
            const sineCtr = 128;
            const colors = [];
            for (let j = 0; j < baseCols - 1; ++j) {
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
            return this.baseColor || this.suggestedBaseColor || this.baseColors[baseCols - 1];
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
            this.viewModel.finalCols = finalColSpec;
            console.log(`CanJS resize called, this.viewModel.finalCols set to ${this.viewModel.finalCols}.`);
        }
    }
});
