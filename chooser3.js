// import {Component} from "//unpkg.com/can@5/core.mjs";
import {Component} from "//unpkg.com/can@5/core.min.mjs";

const release = "1.0";          // "Semantic" program version for end users
document.getElementById("cccVersion").innerHTML = release;
document.title = "CanJS Color Chooser " + release;

const baseCols = 19;

/// Write style sheet from here so we can use its variables in our JavaScript:
let styleSheet = document.createElement('style');
styleSheet.innerHTML = `

.final {
    display: inline-block;
    width: 200px;
    height: 200px;
    margin-left: 50px;
}

/*From Carson's CSS:*/

 :root {
     --grid-cell-size: 20px; /* default for very small screens (otherwise undefined) */
     font-family: sans-serif;
     --bgcolor: lightgray;
     background-color: var(--bgcolor);
 }

/* Scale our grid sizes to user's screen width */
@media (min-width: 490px) {
    :root {
        --grid-cell-size: 25px;
    }
}

@media (min-width: 600px) {
    :root {
        --grid-cell-size: 30px;
    }
}

@media (min-width: 800px) {
    :root {
        --grid-cell-size: 40px;
    }
}

@media (min-width: 1000px) {
    :root {
        --grid-cell-size: 50px;
    }
}

@media (min-width: 1200px) {
    :root {
        --grid-cell-size: 60px;
    }
}

body {
    margin: 10px;
}

h1 {
    text-align: center;
}

#baseColors {
    display: grid;
    grid-template-columns: repeat(${baseCols}, var(--grid-cell-size));
}

#finalColors {
    display: inline-grid;
    grid-template-columns: repeat(7, var(--grid-cell-size)); /* best w/odd number */
}

#readout-grid {
    display: inline-grid;
    grid-template-columns: repeat(3, calc(var(--grid-cell-size) * 4));
    height: calc(var(--grid-cell-size) * 6);
    max-width: 70px; /* scroll screen instead of wrapping beneath elements to my left */
}

base-el, final-el {
    font-size: calc(var(--grid-cell-size) / 4);
    line-height: calc(var(--grid-cell-size) / 4);
    /*border-radius: calc(var(--grid-cell-size) / 8); causes lockups (performance) */
    height: calc(var(--grid-cell-size) / 1.1);
    display: block;
    color: white;
    border-color: var(--bgcolor);
    border-style: solid;
    border-width: 2px;
    cursor: pointer;
    padding-left: calc(var(--grid-cell-size) / 20);
    padding-top: calc(var(--grid-cell-size) / 20);
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
    width: 100px;
    height: 70px;
    align-self: center;
    cursor: pointer;
    border: 3px solid gray;
}

button:hover,
button:focus {
    background: white;
}
`;
document.body.appendChild(styleSheet);   // todo: flashes unstyled: prepend instead?

Component.extend({
    tag: "color-chooser",
    view: `
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
		<span  
			style="{{colorStyle(this.finalOrBaseOrSuggestedColor)}} padding: 12px; border: 3px solid gray;">
			{{{printLongColor(this.finalOrBaseOrSuggestedColor)}}}
		</span>
		        <span style="padding: 12px" v-if="clipCopied"><b>{{clipCopied}}</b> copied to clipboard.</span>
        <span style="padding: 12px" v-else></span>
        <span></span>
        <button on:click="copyToClip(this.finalOrBaseOrSuggestedColor)">
            Copy <b>{{printShortColor(this.finalOrBaseOrSuggestedColor)}}</b> to clipboard</button>
		</span>
	`,
    ViewModel: {
        // STATEFUL PROPS
        suggestedBaseColor: "any",
        baseColor: "any",
        suggestedFinalColor: "any",
        finalColor: "any",

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
                var green = Math.round(Math.sin(sinFreq * j + greenPhase) * sineWidth + sineCtr);
                var blue = Math.round(Math.sin(sinFreq * j + bluePhase) * sineWidth + sineCtr);
                colors.push({red, green, blue})
            }
            // Add gray square:
            red = green = blue = 127;
            colors.push({red, green, blue});
            return colors;
        },
        /*        get lastBaseColor(){
                    return this.baseColors[this.baseColors.length-1];
                },*/
        get baseOrSuggestedColor() {
            // return this.baseColor || this.suggestedBaseColor || this.lastBaseColor;
            return this.baseColor || this.suggestedBaseColor || this.baseColors[baseCols - 1];
        },
        get finalOrBaseOrSuggestedColor() {
            return this.finalColor || this.suggestedFinalColor || this.baseOrSuggestedColor;
        },
        get finalColors() {
            const baseOrSuggestedColor = this.baseOrSuggestedColor;
            const cols = 7;
            let colorArray = [];
            let red;
            let green;
            let blue;
            let xOffset;
            let yOffset;
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < cols; r++) {
                    xOffset = 3 - c;    // How far am I from grid center?
                    yOffset = 3 - r;
                    // Purely empirical way of getting a useful range:
                    red = baseOrSuggestedColor.red + xOffset * 19 + yOffset * 43;
                    green = baseOrSuggestedColor.green + xOffset * 19 + yOffset * 43;
                    blue = baseOrSuggestedColor.blue + xOffset * 19 + yOffset * 43;
                    red = red > 255 ? 255 : red < 1 ? 0 : red;
                    green = green > 255 ? 255 : green < 1 ? 0 : green;
                    blue = blue > 255 ? 255 : blue < 1 ? 0 : blue;
                    colorArray.push({red, green, blue})
                }
            }
            return colorArray;
        },
        // HELPER METHODS
        colorStyle(color) {
            if (color.red + color.green + color.blue > 400)
                return `color: black; background-color: rgb(${color.red},${color.green},${color.blue});`
            else
                return `color: white; background-color: rgb(${color.red},${color.green},${color.blue});`
        },
        printShortColor(color) {
            return `${color.red},${color.green},${color.blue}`;
        },
        printLongColor(color) {
            return `R:${color.red}<br>G:${color.green}<br>B:${color.blue}<br>`
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
        }
    }
});
