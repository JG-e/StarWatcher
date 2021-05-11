import React, {Component} from "react";
import { Row, Col } from 'antd';
import SatSetting from "./SatSetting";
import SatelliteList from "./SatelliteList";
import axios from "axios";
import WorldMap from './WorldMap'
import {NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY} from "../constants";

class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {satInfo: null, isLoading: false, settings : null, satList: null};
    }

    showNearBySatellite = settings => {
        this.setState({settings: settings})
        this.fetchSatellite(settings)
    }

    fetchSatellite = settings => {
        // get settings
        const {latitude, longitude, elevation, altitude} = settings;

        // prepare for option for request
        const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`

        this.setState({
            isLoading : true
        })

        axios.get(url).then(res => {
            console.log("res -> ", res);
            const { data } = res;
            this.setState({
                satInfo : data,
                isLoading : false
            })
        }).catch(err => {
            console.log("err in fetch satellite -> ", err);
            this.setState({
                isLoading: false
            })
        })
    }

    showMap = selected => {
        this.setState(preState => ({
            ...preState,
            isLoading: true,
            satList: [...selected]
        }))
    }

    render() {
        const { satInfo, isLoading, settings, satList } = this.state;
        return (
            <Row className={'main'}>
                <Col span={8} className={"left-side"}>
                    <SatSetting onShow={this.showNearBySatellite} />
                    <SatelliteList satInfo={satInfo}
                                   isLoading={isLoading}
                                   onShowMap={this.showMap}
                    />
                </Col >
                <Col span={16} className={"right-side"}>
                    <WorldMap observerData={settings} satData={satList}/>
                </Col>

            </Row>
        )
    }
}

export default Main;