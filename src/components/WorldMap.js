import React, {Component} from "react";
import { WORLD_MAP_URL, SATELLITE_POSITION_URL, SAT_API_KEY } from "../constants"
import axios from "axios";
import {feature} from "topojson-client";
import { geoKavrayskiy7 } from "d3-geo-projection";
import { select as d3Select} from "d3-selection"
import {geoGraticule, geoPath} from "d3-geo";       // this is used to draw gratitude / longitude
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";
import { Spin } from "antd";


const width = 960
const height = 600

class WorldMap extends Component {
    constructor(props) {
        super(props);
        this.refMap = React.createRef()
        this.refTrack = React.createRef()
        this.map = null;
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
        this.state = {
            isLoading: false,
            isDrawing: false
        }
    }

    componentDidMount() {
        axios.get(WORLD_MAP_URL).then(
            res => {
                console.log(res)
                const { data } = res
                // draw the map
                const land = feature(data, data.objects.countries).features
                this.generateMap(land)
            }
        ).catch(e => console.log(e.message))
    }

    generateMap = land => {
        // create projection
        const projection = geoKavrayskiy7()
            .scale(170)
            .translate([width/2, height/2])
            .precision(.1)

        const graticule = geoGraticule()
        
        // get map canvas
        const canvas = d3Select(this.refMap.current)
            .attr("width", width).attr("height", height)

        // get track canvas
        const track_canvas = d3Select(this.refTrack.current)
            .attr("width", width).attr("height", height)


        let context = canvas.node().getContext('2d')
        let context2 = track_canvas.node().getContext('2d')

        let path = geoPath()
            .projection(projection)
            .context(context)

        // data <-> map
        land.forEach( ele => {
            // Countries info
            context.fillStyle = '#B3DDEF';  // The colour of the land
            context.strokeStyle = '#000';   // The colour of the boarder
            context.globalAlpha = 0.7;      // Transparency of the map
            context.beginPath();            // Begin to draw tha path
            path(ele);
            context.fill();
            context.stroke();               // Draw the strokes
            // Graticule info
            context.strokeStyle = 'rgba(220, 220, 220, 0.1)';   // Altitude/longitude rgb + alphavalue
            context.beginPath();
            path(graticule());
            context.lineWidth = 0.1;    // Width of the stroke of the line altitude / longitude line
            context.stroke();
            // Graticule outline
            context.beginPath();
            context.lineWidth = 0.5;       // Stroke width of the boarder and the outer line of the map
            path(graticule.outline());
            context.stroke();
        })
        this.map = {
            graticule,
            context,
            context2,
            projection
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.satData !== this.props.satData){
            // Fetch satellite positions
            const {
                latitude,
                longitude,
                elevation,
                duration
            } = this.props.observerData;
            const endTime = duration * 60

            this.setState({isLoading: true})

            const urls = this.props.satData.map(sat => {
                const { satid } = sat
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;
                return axios.get(url)
            })

            Promise.all(urls).then(res => {
                this.setState({
                    isLoading: false,
                    isDrawing: true
                })

                const arr = res.map(sat => sat.data)

                if (!prevState.isDrawing) {
                    // Tracking satellite
                    this.track(arr)
                } else {
                    const oHint = document.getElementsByClassName("hint")[0];
                    oHint.innerHTML =
                        "Please wait for these satellite animation to finish before selection new ones!";
                }

            }).catch(e => {
                console.log("arr in fetch satellite positions: ", e )
            })
        }
    }

    track = data => {
        // check if there is position
        if (data.length === 0 || !data[0].hasOwnProperty('positions')) {
            throw new Error("no position data")
        }

        const len = data[0].positions.length
        const { context2 } = this.map

        let now = new Date()

        let i = 0

        let timer = setInterval(() => {
            // get current time
            let current = new Date()
            // get passed time
            let timePassed = i === 0 ? 0 : current - now
            let time = new Date(now.getTime() + 60 * timePassed)

            // clear board
            context2.clearRect(0, 0, width, height)

            // config the text style / display timer
            context2.font = "bold 14px sans-serif";
            context2.fillStyle = "#333";
            context2.textAlign = "center";
            context2.fillText(d3TimeFormat(time), width / 2, 10);

            // when to clear timer
            if (i >= len) {
                clearInterval(timer)
                this.setState({isDrawing: false})
                const oHint = document.getElementsByClassName("hint")[0]
                oHint.innerHTML = ""
                return
            }

            // for each satellite
            data.forEach(sat => {
                const { info, positions } = sat;
                this.drawSat(info, positions[i])
            })

            i += 60

        }, 1000)
    }

    drawSat = (sat, pos) => {
        const { satlongitude, satlatitude } = pos;

        if (!satlongitude || !satlatitude) return;

        const { satname } = sat;
        // regex to format the string
        const nameWithNumber = satname.match(/\d+/g).join("");

        const { projection, context2 } = this.map;
        // map the x and y to the world map using the gratitude
        const xy = projection([satlongitude, satlatitude]);

        context2.fillStyle = this.color(nameWithNumber);
        context2.beginPath();
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
        context2.fill();

        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14);

    }


    render() {
        const { isLoading } = this.state
        return (
            <div className={"map-box"}>
                {isLoading ? (
                    <div className="spinner">
                        <Spin tip="Loading..." size="large" />
                    </div>

                ) : null}
                <canvas ref={this.refMap} className={"map"}/>
                <canvas ref={this.refTrack} className={"track"}/>
                <div className={"hint"}/>
            </div>
        )
    }
}

export default WorldMap;