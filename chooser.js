import {Component} from "//unpkg.com/can@5/core.mjs";
Component.extend({
    tag: "color-chooser",
    view: `
		<div>Click to lock base color 
			<span style="{{colorStyle(this.baseOrSuggestedColor)}}">
				{{printShortColor(this.baseOrSuggestedColor)}}
			</span>
		</div>
		<ul class='base-colors'>
			{{#for(color of this.baseColors)}}
				<li style="{{colorStyle(color)}}" 
					on:click="selectBaseColor(color)"
					on:mouseenter="suggestBaseColor(color)"
					{{#eq(color, baseColor)}}class='selected'{{/eq}}>
					R{{color.red}}<br/>
					G{{color.green}}<br/>
					B{{color.blue}}
				</li>
			{{/for}}
		</ul>
		<div class='clear'>
			Click to lock final color
			<span style="{{colorStyle(this.finalOrBaseOrSuggestedColor)}}">
				{{printShortColor(this.finalOrBaseOrSuggestedColor)}}
			</span>
		</div>
		<ul class='final-colors'>
			{{#for(color of this.finalColors)}}
				<li style="{{colorStyle(color)}}" 
					on:click="selectFinalColor(color)"
					on:mouseenter="suggestFinalColor(color)"
					{{#eq(color,this.finalColor)}}class='selected'{{/eq}}>
					R{{color.red}}<br/>
					G{{color.green}}<br/>
					B{{color.blue}}
				</li>
			{{/for}}
		</ul>
		<div class='final clear' 
			style="{{colorStyle(this.finalOrBaseOrSuggestedColor)}}">
			FINAL COLOR
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
        get lastBaseColor(){
            return this.baseColors[this.baseColors.length-1];
        },
        get baseOrSuggestedColor(){
            return this.baseColor || this.suggestedBaseColor || this.lastBaseColor;
        },
        get finalOrBaseOrSuggestedColor(){
            return this.finalColor || this.suggestedFinalColor || this.baseOrSuggestedColor;
        },
        get finalColors() {
            var baseOrSuggestedColor = this.baseOrSuggestedColor;
            var cols = 6;
            var finalColors = [];
            for(var c = 0; c < cols; c++) {
                for(var r = 0 ; r < cols; r++) {
                    let xOffset = 3 - c;    // How far am I from grid center?
                    let yOffset = 3 - r;
                    // Purely empirical way of getting a useful range:
                    let red = baseOrSuggestedColor.red + xOffset * 19 + yOffset * 43;
                    let green = baseOrSuggestedColor.green + xOffset * 19 + yOffset * 43;
                    let blue = baseOrSuggestedColor.blue + xOffset * 19 + yOffset * 43;
                    red = red > 255 ? 255 : red < 1 ? 0 : red;
                    green = green > 255 ? 255 : green < 1 ? 0 : green;
                    blue = blue > 255 ? 255 : blue < 1 ? 0 : blue;
                    finalColors.push({red, green, blue})
                }
            }
            return finalColors;
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
            // There's less imperitive ways of doing this
            this.suggestedFinalColor = null;
            this.finalColor = null;
        },
        suggestFinalColor(color) {
            this.suggestedFinalColor = color;
        },
        selectFinalColor(aColor) {
            // debugger;
            this.finalColor = aColor;
        }
    }
});
