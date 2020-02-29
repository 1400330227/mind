import { JsMind } from "./jsMind";
import { MindData, Mind } from "./mind";
import { NodeArray } from './format/nodeArray'
import { NodeTree } from './format/nodeTree'

export class DataProvider {

    jsMind: JsMind;
    constructor(jsMind: JsMind) {
        this.jsMind = jsMind;
    }

    init() {
        console.log('data init')
    }

    reset() {
        console.log('data reset')
    }

    /**
     * 获取 Mind 对象
     * @param mindData mind 数据源
     * @return Mind
     */
    load(mindData: MindData): Mind {
        let dataFormat = mindData.format;
        let mind: Mind = null;

        if (dataFormat === 'node_array') {
            mind = NodeArray.getMind(mindData);
        } else if (dataFormat === 'node_tree') {
            mind = NodeTree.getMind(mindData);
        } else {
            console.error(`失败，不支持 ${mindData.format}`)
        }

        return mind;
    }


    /**
     * 获取数据 data
     * @param dataFormat 数据格式
     */
    getData(dataFormat: string) {
        let _dataFormat = dataFormat;
        let data = null;
        if(_dataFormat === 'node_array') {
            data = NodeArray.getData(this.jsMind.mind);
        }else if(dataFormat === 'node_tree') {
            data = NodeTree.getData(this.jsMind.mind);
        } else {
            console.error(`失败，不支持数据源格式`);
        }

        return data;
    }
}