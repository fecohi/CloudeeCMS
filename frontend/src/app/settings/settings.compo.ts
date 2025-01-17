/*
 * Copyright WebGate Consulting AG, 2020
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * permissions and limitations under the License.
 *
 */

import { Component, OnInit } from '@angular/core';
import { BackendService } from '../services/backend.service';
import { TabsNavService } from '../services/tabs.service';
import { BucketEditDialogComponent } from './dialogs/bucketedit-dialog';
import { MatDialog } from '@angular/material/dialog';
import { CFDistEditDialogComponent } from './dialogs/cfdistedit-dialog';
import { BookmarkEditDialogComponent } from './dialogs/bookmarkedit-dialog';
import { ImportDialogComponent } from './dialogs/restore-dialog';
import { UpdaterDialogComponent } from './dialogs/updater-dialog';
import { versioninfo } from '../version';
import { environment } from 'src/environments/environment';
import { VariableEditDialogComponent } from './dialogs/variableedit-dialog';
import { PackageUploadDialogComponent } from './dialogs/pkgupload-dialog';
import { GlobalFunctionEditDialogComponent } from './dialogs/fnedit-dialog';
import { ImageProfileEditDialogComponent } from './dialogs/imgprofileedit-dialog';
import { FeedEditDialogComponent } from './dialogs/feededit-dialog';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.compo.html',
  styleUrls: ['./settings.compo.css']
})

export class SettingsComponent implements OnInit {

  constructor(
    private backendSVC: BackendService,
    public tabsSVC: TabsNavService,
    public dialog: MatDialog
  ) { }

  config: any = null;
  loading: boolean;
  tmpAddCat = '';
  selectedTargetEnv: string;
  backupLog = [];
  bkupLoading = false;
  restartRequired = false;
  APP_VERSION = versioninfo.version;
  enableOnlineUpdates: boolean;
  imageprofiles = null;
  APIGWURL = '';
  hasChanges = false;
  tabID = 'tab-settings';

  ngOnInit() {
    this.APIGWURL = environment.API_Gateway_Endpoint;
    this.loadConfig();
  }

  loadConfig() {
    const that = this;
    this.enableOnlineUpdates = environment.enableOnlineUpdates;
    that.setLoading(true);
    this.backendSVC.getConfig(true).then(
      (rc: any) => {
        that.config = rc.cfg;
        that.setLoading(false);
      },
      (err) => {
        that.tabsSVC.printNotification('Error while loading');
        console.error(err);
        that.setLoading(false);
      }
    );
    // Load image profiles
    this.backendSVC.getImageProfiles(true).then(
      (rc: any) => {
        that.imageprofiles = rc.imgprofiles;
      },
      (err) => {
        that.tabsSVC.printNotification('Error while loading imageprofiles');
        console.error(err);
      }
    );
  }

  btnSave(): void {
    const that = this;
    that.setLoading(true);
    this.backendSVC.saveConfig(this.config).then(
      (rc: any) => {
        that.setLoading(false);
        if (rc.success) {
          that.tabsSVC.printNotification('Configuration saved');
          that.setHasChanges(false);
          if (that.restartRequired) {
            if (confirm('Restart of Webapplication recommended.\nRestart now?')) { window.location.reload(); }
          }
        }
      },
      (err) => {
        console.error(err);
        that.tabsSVC.printNotification('Error while saving configuration');
        that.setLoading(false);
      }
    );
    // Save image profiles
    this.backendSVC.saveImageProfiles(this.imageprofiles).then(
      (rc: any) => { },
      (err) => {
        console.error(err);
        that.tabsSVC.printNotification('Error while saving image profiles');
      }
    );
  }
  setLoading(on: boolean) {
    this.loading = on;
    this.tabsSVC.setLoading(on);
  }
  btnEditBucket(thisBucket: any) {
    const that = this;
    const dialogRef = this.dialog.open(BucketEditDialogComponent, { width: '700px', disableClose: false, data: { bucket: thisBucket } });
    that.restartRequired = true;
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'add') {
        if (!that.config.buckets) { that.config.buckets = []; }
        that.config.buckets.push(result.bucket);
      }
    });
    that.setHasChanges(true);
  }
  btnEditCFDist(thisDist: any) {
    const that = this;
    const dialogRef = this.dialog.open(CFDistEditDialogComponent, { width: '450px', disableClose: false, data: { dist: thisDist } });
    dialogRef.afterClosed().subscribe(result => {
      that.restartRequired = true;
      if (result && result.action === 'add') {
        if (!that.config.cfdists) { that.config.cfdists = []; }
        that.config.cfdists.push(result.dist);
      }
    });
    that.setHasChanges(true);
  }
  btnEditGlobalFunction(thisFN: any) {
    const that = this;
    const dialogRef = this.dialog.open(GlobalFunctionEditDialogComponent, { width: '800px', disableClose: false, data: { fn: thisFN } });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'add') {
        if (!that.config.pugGlobalScripts) { that.config.pugGlobalScripts = []; }
        that.config.pugGlobalScripts.push(result.fn);
      }
    });
    that.setHasChanges(true);
  }
  btnEditBM(thisBM: any) {
    const that = this;
    const dialogRef = this.dialog.open(BookmarkEditDialogComponent, { width: '450px', disableClose: false, data: { bm: thisBM } });
    dialogRef.afterClosed().subscribe(result => {
      that.restartRequired = true;
      if (result && result.action === 'add') {
        if (!that.config.bookmarks) { that.config.bookmarks = []; }
        that.config.bookmarks.push(result.bm);
      }
    });
    that.setHasChanges(true);
  }
  btnEditFeed(thisFD: any) {
    const that = this;
    const dialogRef = this.dialog.open(FeedEditDialogComponent, {
      width: '450px', disableClose: false,
      data: { feed: thisFD, lstCategories: this.config.categories }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'add') {
        if (!that.config.feeds) { that.config.feeds = []; }
        that.config.feeds.push(result.feed);
      }
    });
    that.setHasChanges(true);
  }
  btnDeleteBucket(bucket: any) {
    if (!confirm('Delete this entry?')) { return; }
    this.restartRequired = true;
    for (let i = 0; i < this.config.buckets.length; i++) {
      if (this.config.buckets[i] === bucket) {
        this.config.buckets.splice(i, 1);
        return;
      }
    }
    this.setHasChanges(true);
  }
  btnDeleteCFDist(dist: any) {
    if (!confirm('Delete this entry?')) { return; }
    this.restartRequired = true;
    for (let i = 0; i < this.config.cfdists.length; i++) {
      if (this.config.cfdists[i] === dist) {
        this.config.cfdists.splice(i, 1);
        return;
      }
    }
    this.setHasChanges(true);
  }
  btnDeleteGlobalFunction(fn: any) {
    if (!confirm('Delete this entry?')) { return; }
    for (let i = 0; i < this.config.pugGlobalScripts.length; i++) {
      if (this.config.pugGlobalScripts[i] === fn) {
        this.config.pugGlobalScripts.splice(i, 1);
        return;
      }
    }
    this.setHasChanges(true);
  }
  btnDeleteBM(bm: any) {
    if (!confirm('Delete this entry?')) { return; }
    this.restartRequired = true;
    for (let i = 0; i < this.config.bookmarks.length; i++) {
      if (this.config.bookmarks[i] === bm) {
        this.config.bookmarks.splice(i, 1);
        return;
      }
    }
    this.setHasChanges(true);
  }
  btnDeleteFeed(fd: any) {
    if (!confirm('Delete this entry?')) { return; }
    this.restartRequired = true;
    for (let i = 0; i < this.config.feeds.length; i++) {
      if (this.config.feeds[i] === fd) {
        this.config.feeds.splice(i, 1);
        return;
      }
    }
    this.setHasChanges(true);
  }
  btnAddCategory() {
    if (this.tmpAddCat !== '') {
      if (!this.config.categories) { this.config.categories = []; }
      this.config.categories.push(this.tmpAddCat);
      this.tmpAddCat = '';
    }
    this.setHasChanges(true);
  }
  btnRemoveCategory(delCat: string) {
    if (!confirm('Delete this entry?')) { return; }
    for (let i = 0; i < this.config.categories.length; i++) {
      if (this.config.categories[i] === delCat) {
        this.config.categories.splice(i, 1);
        return;
      }
    }
    this.setHasChanges(true);
  }
  btnDeleteImageProfile(delID: string) {
    if (!confirm('Delete this entry?')) { return; }
    for (let i = 0; i < this.imageprofiles.lstProfiles.length; i++) {
      if (this.imageprofiles.lstProfiles[i].id === delID) {
        this.imageprofiles.lstProfiles.splice(i, 1);
        return;
      }
    }
    this.setHasChanges(true);
  }
  btnEditImageProfile(imgp: any) {
    const that = this;
    // tslint:disable-next-line: max-line-length
    const dialogRef = this.dialog.open(ImageProfileEditDialogComponent, { width: '800px', disableClose: false, data: { imageprofile: imgp } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'add') {
          if (!that.imageprofiles.lstProfiles) { that.imageprofiles.lstProfiles = []; }
          that.imageprofiles.lstProfiles.push(result.imageprofile);
        } else if (result.action === 'update') {
          for (let i = 0; i < that.imageprofiles.lstProfiles.length; i++) {
            if (that.imageprofiles.lstProfiles[i].id === result.imageprofile.id) {
              that.imageprofiles.lstProfiles[i] = result.imageprofile;
            }
          }
        }
      }
    });
    this.setHasChanges(true);
  }
  btnBackup() {
    if (!confirm('Create database backup?')) { return; }
    this.backupLog = [];
    const that = this;
    if (!this.selectedTargetEnv || this.selectedTargetEnv === '-') {
      alert('You must select a bucket.');
      return;
    }
    this.bkupLoading = true;
    this.backendSVC.createDBBackup(this.selectedTargetEnv).then(
      (data: any) => {
        that.bkupLoading = false;
        if (data.log) { that.backupLog = data.log; }
        if (data.success) { that.tabsSVC.printNotification('Backup saved to S3 bucket'); }
      },
      (err) => {
        console.error(err);
        that.backupLog.push(err.status + ': ' + err.message);
        that.tabsSVC.printNotification('Error while loading');
        that.bkupLoading = false;
      }
    );
  }
  btnImportDialog() {
    const dialogRef = this.dialog.open(ImportDialogComponent,
      { width: '550px', disableClose: false, data: { bucket: this.selectedTargetEnv } }
    );
  }
  btnPkgUploadDialog() {
    const testBucket = this.getBucketByLabel('Test').bucketname;
    this.dialog.open(PackageUploadDialogComponent,
      { width: '550px', disableClose: true, data: { targetEnv: testBucket } }
    );
  }
  setRestartRequired(): void {
    this.restartRequired = true;
    this.setHasChanges(true);
  }
  btnShowUpdater(): void {
    this.dialog.open(UpdaterDialogComponent, { width: '450px', disableClose: true, data: {} });
  }

  btnEditVariable(thisVar: any) {
    const that = this;
    const dialogRef = this.dialog.open(VariableEditDialogComponent, { width: '450px', disableClose: false, data: { variable: thisVar } });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'add') {
        if (!that.config.variables) { that.config.variables = []; }
        that.config.variables.push(result.variable);
      }
    });
    this.setHasChanges(true);
  }
  btnDeleteVariable(variable: any) {
    if (!confirm('Delete this entry?')) { return; }
    for (let i = 0; i < this.config.variables.length; i++) {
      if (this.config.variables[i] === variable) {
        this.config.variables.splice(i, 1);
        return;
      }
    }
    this.setHasChanges(true);
  }

  getBucketByLabel(bLabel: string): any {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.config.buckets.length; i++) {
      if (this.config.buckets[i].label === bLabel) {
        return this.config.buckets[i];
      }
    }
  }
  setHasChanges(hasChanges): void {
    if (this.hasChanges !== hasChanges) {
      this.tabsSVC.setTabHasChanges(this.tabID, hasChanges);
      this.hasChanges = hasChanges;
    }
  }
}
