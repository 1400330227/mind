import {$document, $window} from "./dom";

/**
 * 读取文件
 * @param fileData 文件
 * @param fnCallback 读取文件的回调函数
 */
export function read(fileData: File, fnCallback: (result: string | ArrayBuffer | null, name: string) => void) {
    const fileReader = new FileReader();

    fileReader.onload = function () {
        fnCallback(fileReader.result, fileData.name)
    };
    fileReader.readAsText(fileData)
}

/**
 * 保存文件到本地
 * @param fileData 文件
 * @param type mime 类型
 * @param name 文件名
 */
export function save(fileData: File, type: string, name: string) {
    let blob;
    if (typeof $window.Blob === 'undefined') {
        const BlobBuilder = $window.BlobBuilder || $window.MozBlobBuilder || $window.WebKitBlobBuilder || $window.MSBlobBuilder;
        const blobBuilder = new BlobBuilder();

        blobBuilder.append(fileData);
        blob = blobBuilder.getBlob(type);
    }

    blob = new Blob([fileData], {type: type});
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, name);
    } else {
        const URL = $window.URL || $window.webkitURL;
        const blobUrl = URL.createObjectURL(blob);

        const anchor = $document.createElement('a');
        if (typeof anchor.download !== 'undefined') {
            anchor.style.visibility = 'hidden';
            anchor.href = blobUrl;
            anchor.download = name;
            $document.body.insertBefore(anchor, null);

            const mouseEvent = new MouseEvent('click', {bubbles: true, cancelable: true});
            anchor.dispatchEvent(mouseEvent);
            $document.body.removeChild(anchor);
        } else {
            location.href = blobUrl;
        }
    }
}
