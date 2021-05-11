import {Avatar, Button, Checkbox, List, Spin} from "antd";
import React from "react";
import satellite from "../assets/images/satellite.svg"

class SatelliteList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selected : [],
            isLoading: false
        }
    }

    onChange = e => {
        console.log(e.target)
        // step 1 get datainfo and checked
        const { dataInfo, checked } = e.target
        // step 2 add or remove selected satellite to/from selected array
        const {selected} = this.state
        const list = this.addOrRemove(dataInfo, checked, selected)
        // step 3 setState
        this.setState({
            selected: list
        })
    }

    addOrRemove = (sat, status, list) => {
        // case 1: check is true
        //      -> sat is not in the list -> add it in
        //      -> sat is in the list -> do nothing


        // case 2: check is false
    //    -> sat is not in the list -> do nothing
    //     -> otherwise -> remove it from the list
        const found = list.some(item => item.satid === sat.satid)
        if ( status && !found){
            // add
            list = [...list, sat]

        }
        if (!status && found){
            // remove it
            list = list.filter( item => item.satid !== sat.satid)
        }
        return list

    }
    onShowSatOnMap = () => {
        // pass selected sat list to Main component
        this.props.onShowMap(this.state.selected)
    }

    render() {
        const satList = this.props.satInfo ? this.props.satInfo.above : []
        const {isLoading} = this.props
        const { selected } = this.state

        return (
            <div className={"sat-list-box"}>
                <div className={"btn-container"}>
                    <Button className={"sat-list-btn"}
                            size={"large"}
                            type={"primary"}
                            disabled={selected.length === 0}
                            onClick={this.onShowSatOnMap}
                    >
                        Track on the map
                    </Button>
                </div>
                <hr/>

                {isLoading ? <div className={"spin-box"}>
                <Spin tip={"Loading..."} size={"large"}/>
                </div> :
                <List
                    className={"sat-list"}
                    itemLayout={"horizontal"}
                    size={"small"}
                    dataSource={satList}
                    renderItem={ item => {
                        // console.log("item -> ", item)
                        return (
                            <List.Item
                                actions={[<Checkbox dataInfo={item} onChange={this.onChange}/>]}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar size={50} src={satellite}/>}
                                    title={<p>{item.satname}</p>}
                                    description={`Launch Date: ${item.launchDate}`}
                                />

                            </List.Item>
                        )
                    }}
                />}
        </div>)
    }
}

export default SatelliteList;