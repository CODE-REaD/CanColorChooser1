// import {Component} from "//unpkg.com/can@5/core.mjs";
import {Component} from "//unpkg.com/can@5/core.min.mjs";

const release = "1.0";          // "Semantic" program version for end users
document.getElementById("cccVersion").innerHTML = release;
document.title = "CanJS Color Chooser " + release;

Component.extend({
    tag: "color-chooser",
    view: `
		<div>Click to lock base color 
			<span style="{{colorStyle(this.baseOrSuggestedColor)}}">
				{{printShortColor(this.baseOrSuggestedColor)}}
			</span>
		</div>
		<base-grid id="baseColors">
			{{#for(color of this.baseColors)}}
				<base-el style="{{colorStyle(color)}}" 
					on:click="selectBaseColor(color)"
					on:mouseenter="suggestBaseColor(color)"
					{{#eq(color, baseColor)}}class='selected'{{/eq}}>
					R:{{color.red}}<br/>
					G:{{color.green}}<br/>
					B:{{color.blue}}
				</base-el>
			{{/for}}
			<br>
		</base-grid>
		<div class='clear'>
			Click to lock final color
			<span style="{{colorStyle(this.finalOrBaseOrSuggestedColor)}}">
				{{printShortColor(this.finalOrBaseOrSuggestedColor)}}
			</span>
		</div>
		<final-grid id="finalColors">
			{{#for(color of this.finalColors)}}
				<final-el style="{{colorStyle(color)}}" 
					on:click="selectFinalColor(color)"
					on:mouseenter="suggestFinalColor(color)"
					{{#eq(color,this.finalColor)}}class='selected'{{/eq}}>
					R:{{color.red}}<br/>
					G:{{color.green}}<br/>
					B:{{color.blue}}
				</final-el>
			{{/for}}
		</final-grid>
		<div class='final clear' 
			style="{{colorStyle(this.finalOrBaseOrSuggestedColor)}}">
			FINAL COLOR:
			{{printShortColor(this.finalOrBaseOrSuggestedColor)}}
		</div>
	`,
    ViewModel: {
        // STATEFUL PROPS
        baseCols: {default: 19},
        suggestedBaseColor: "any",
        baseColor: "any",

        suggestedFinalColor: "any",
        finalColor: "any",

        // DERIVED VALUES
        get baseColors(){
            const sinFreq = .3;
            const greenPhase = 2 * Math.PI / 3;
            const bluePhase = 4 * Math.PI / 3;
            const sineWidth = 127;
            const sineCtr = 128;
            const colors = [];
            for (let j = 0; j < this.baseCols; ++j) {
                var red = Math.round(Math.sin(sinFreq * j + 0) * sineWidth + sineCtr);
                var green = Math.round(Math.sin(sinFreq * j + greenPhase) * sineWidth + sineCtr);
                var blue = Math.round(Math.sin(sinFreq * j + bluePhase) * sineWidth + sineCtr);
                colors.push({red, green, blue})
            }
            return colors;
        },
/*        get lastBaseColor(){
            return this.baseColors[this.baseColors.length-1];
        },*/
        get baseOrSuggestedColor(){
            // return this.baseColor || this.suggestedBaseColor || this.lastBaseColor;
            return this.baseColor || this.suggestedBaseColor || this.baseColors[this.baseCols - 1];
        },
        get finalOrBaseOrSuggestedColor(){
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
            for(let c = 0; c < cols; c++) {
                for(let r = 0 ; r < cols; r++) {
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
        colorStyle(color){
            return `background-color: rgb(${color.red},${color.green},${color.blue});`
        },
        printShortColor(color) {
            return `${color.red},${color.green},${color.blue}`;
        },
        // METHODS THAT CHANGE STATE
        suggestBaseColor(color) {
            this.suggestedBaseColor = color;
        },
        selectBaseColor(color) {
            this.baseColor = color;
            // There are less imperative ways of doing this
            this.suggestedFinalColor = null;
            this.finalColor = null;
        },
        suggestFinalColor(color) {
            this.suggestedFinalColor = color;
        },
        selectFinalColor(selectedFinalColor) {
            this.finalColor = selectedFinalColor;
        }
    }
});
