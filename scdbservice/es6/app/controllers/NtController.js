'use strict';
/* Load Task Data Access Object */
const NtDao = require('../dao/NtDao');
var ejs = require('../utils/ejs');
var pdf = require('../utils/pdf');
var google = require('../utils/google');
var uuid = require('uuid');
var path = require('path');
var mapbox = require('../utils/mapbox');
var moment = require('moment');
/* Load Controller Common function */
const ControllerCommon = require('./common/controllerCommon');

class NtController {
    
    constructor() {
        this.ntDao = new NtDao();
        this.common = new ControllerCommon();
    }  
    findById(req, res) {
        let id = req.params.id;
        this.ntDao.findById(id)
            .then(this.common.findSuccess(res))
            .catch(this.common.findError(res));
    }
    findByIdParam(req, res) {
        let id = req.query.id;
        let f = req.query.f;
        if (f=='pdf'){
            this.ntDao.findById(id).then(data=>{
               
                if(data.length ==0){
                    reject({'error':'not found'});
                }
                var temp = data[0];
                temp.createtime= new Date().toISOString().slice(0,10);
                temp.year=temp.createtime.substring(-4);
                temp.title='Survey Control Mark Report , NT';
              
                return temp;
            }).then(temp=>{
                return google.toStreetView(temp.dec_long,temp.dec_lat).then(data=>{
                    temp.url = data.url;
                    if(data.date){
                        temp.img_capture_date = 'Image Capture: '+data.date;
                    }
                    else{
                        temp.img_capture_date = '';
                    }
                    temp.mapUrl = google.toMapView(temp.dec_long,temp.dec_lat,data);
            
                    return temp;
                });
                /*.catch(err=>{
                    if (err =='no streetView'){
                        temp.url = 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1543140159963&di=664d005998d8222212188f141922b82e&imgtype=0&src=http%3A%2F%2Fimg05.tooopen.com%2Fimages%2F20150705%2Ftooopen_sy_132981382614.jpg';
                        return temp;
                    }
                    else{
                        temp.url='';
                        return temp;
                    }
                });
                */
            }).then(temp=>{
                return mapbox.rgeocoding(temp.dec_long,temp.dec_lat).then(data=>{
                    temp.address = data.address;
                    return  temp;
                });
            }).then(temp=>{
                temp.dec_long=temp.dec_long.toString().substring(0,6);
                temp.dec_lat=temp.dec_lat.toString().substring(0,6);
                return ejs.toHTML('./es6/app/templates/nt.ejs', temp);
            }).then(function (html) {
                
                var assetPath = path.join(__dirname,'../../../public/');
                var options = { 'format': 'A4',  'orientation': 'portrait',base: "file://"+assetPath };
                var result='data/out/pdf_' + uuid.v1() + '.pdf';
                var output =path.join(__dirname, '../../../public/'+result);
                
                
                return pdf.toPDF(html, options, output);
            }).then(response=>{
                var fileName=response.filename;
                var idx=fileName.indexOf('/data');
                fileName = fileName.substring(idx);
                return {fileName:fileName};
            }).then(this.common.findSuccess(res)).catch(this.common.findError(res));
        }
        else
        {
            this.ntDao.findById(id)
            .then(this.common.findSuccess(res))
            .catch(this.common.findError(res));
        }
    }
    findAll(req,res) {
        this.ntDao.findAll()
            .then(this.common.findSuccess(res))
            .catch(this.common.findError(res));
    }
    query(req,res) { 
        let pageNum = req.query.pageNum;
        let pageCount = req.query.pageCount;
        if (!pageCount)
        {
            pageCount = 10;
        }
        if (!pageNum)
        { 
            pageNum=1;
        }
        this.ntDao.findByPaging(pageNum,pageCount)
            .then(this.common.findSuccess(res))
            .catch(this.common.findError(res));
    }
    nearst(req,res) {
        let n = req.query.n;
        if (!n)
        {
            n = 10;
        }
        let x = req.query.x;
        let y = req.query.y;
        if(!x || !y)
        {
            this.common.findError(res)
        }
        else
        {
            this.ntDao.findByNearst(x,y,n)
            .then(this.common.findSuccess(res))
            .catch(this.common.findError(res));
        }
    }
}
module.exports = NtController;