'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('notification-files.js','utf8'),ctx);const validate=ctx.window.BaridaNotificationFiles.validate;
for(const [name,mime] of [['PHOTO.JPG','image/jpeg'],['notlar.pdf','application/pdf'],['ders.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],['puanlar.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],['dosyalar.zip','application/zip']])assert.equal(validate({name,size:20*1024*1024}).mime,mime);
for(const file of [{name:'file.pdf',size:0},{name:'file.pdf',size:20*1024*1024+1},{name:'x.html',size:10},{name:'x.svg',size:10},{name:'x.exe',size:10}])assert.throws(()=>validate(file));
assert(!validate({name:'../test\n.pdf',size:10}).name.match(/[\/\\\n]/));
const source=fs.readFileSync('academy.js','utf8');assert(source.includes('assignment_id,attachments'));assert(source.includes('attachments.send'));assert(source.includes('BaridaNotificationFiles?.render'));assert(fs.readFileSync('academy.html','utf8').includes('notification-files.js'));
console.log('PASS image/document formats, exact 20 MB boundary, unsafe type rejection, filename sanitation and shared UI integration');
