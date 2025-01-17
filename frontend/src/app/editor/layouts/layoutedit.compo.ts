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

import { Component, OnInit, Input } from '@angular/core';
import { BackendService } from 'src/app/services/backend.service';
import { Layout } from './layout';
import { MatDialog } from '@angular/material/dialog';
import { LayoutFieldDialogComponent } from './dialogs/layoutfield.dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TabsNavService } from 'src/app/services/tabs.service';

@Component({
  selector: 'app-layoutedit',
  templateUrl: './layoutedit.compo.html'
})

export class LayoutEditComponent implements OnInit {
  @Input() docid: string;
  @Input() tabid: string;

  constructor(
    private tabsSVC: TabsNavService,
    private backendSVC: BackendService,
    public dialog: MatDialog
  ) { }

  loading = true;
  layout: Layout;
  lstAcceptFieldTypes: any = ['text', 'textarea', 'richtext', 'container', 'dropdown', 'checkbox', 'number', 'image'];
  showPugHelp = false;
  hasChanges = false;

  ngOnInit() {
    const that = this;
    if (this.docid === 'NEW') {
      this.layout = new Layout();
      that.tabsSVC.setTabTitle(this.tabid, 'New Layout');
      this.loading = false;
      setTimeout(() => { that.setLoading(false); }, 1000); // delay to prevent error
    } else {
      this.loadLayoutByID(this.docid);
    }
  }

  loadLayoutByID(id: string) {
    const that = this;
    this.backendSVC.getItemByID(id).then(
      (data: any) => {
        if (data.item) {
          that.layout = data.item;
          that.tabsSVC.setTabTitle(that.tabid, data.item.title || 'Untitled Layout');
        }
        that.setLoading(false);
      },
      (err) => {
        that.tabsSVC.printNotification('Error while loading layout');
        that.setLoading(false);
      }
    );
  }

  saveLayout() {
    if (!this.layout.okey || this.layout.okey === '') {
      alert('Key name is required!');
      return;
    }
    const that = this;
    this.setLoading(true);
    this.backendSVC.saveLayout(this.layout).then(
      (data: any) => {
        if (that.layout.id !== data.id) { // first save of NEW doc
          that.tabsSVC.changeTabID(that.tabid, 'tab-layout-' + data.id, data.id);
          that.tabid = 'tab-layout-' + data.id;
          that.docid = data.id;
        }
        that.layout.id = data.id;
        that.setLoading(false);
        that.tabsSVC.setTabTitle(that.tabid, that.layout.title);
        that.tabsSVC.setTabDataExpired('tab-layouts', true);
        if (data.success) {
          that.tabsSVC.printNotification('Document saved');
          that.setHasChanges(false);
        }
      },
      (err) => {
        that.tabsSVC.printNotification('Error while saving layout');
        that.setLoading(false);
      }
    );
  }
  btnAddNewField() {
    const that = this;
    const dialogRef = this.dialog.open(LayoutFieldDialogComponent,
      { width: '800px', disableClose: false, data: { isNew: true, accept: this.lstAcceptFieldTypes } }
    );
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'addnew') { that.layout.custFields.push(result.fld); }
    });
    this.setHasChanges(true);
  }
  btnEditField(fld) {
    this.dialog.open(LayoutFieldDialogComponent, { width: '800px', disableClose: false, data: { fld, accept: this.lstAcceptFieldTypes } });
    this.setHasChanges(true);
  }
  btnDeleteField(fld) {
    if (!confirm('Do you really want to delete the field \'' + fld.fldName + '\'?')) { return false; }
    for (let i = 0; i < this.layout.custFields.length; i++) {
      if (this.layout.custFields[i] === fld) { this.layout.custFields.splice(i, 1); }
    }
    this.setHasChanges(true);
  }
  btnNavigateTo(npath: string): void {
    this.tabsSVC.navigateTo(npath);
  }
  dropSortObj(lst, event: CdkDragDrop<string[]>) {
    moveItemInArray(lst, event.previousIndex, event.currentIndex);
    this.setHasChanges(true);
  }
  btnDelete() {
    if (!confirm('Do you really want to delete this object?')) { return false; }
    const that = this;
    this.backendSVC.deleteItemByID(this.layout.id).then(
      (data: any) => {
        if (data.success) {
          that.tabsSVC.printNotification('Document deleted');
          that.tabsSVC.setTabDataExpired('tab-layouts', true);
          that.tabsSVC.closeTabByID(that.tabid);
        }
      },
      (err) => {
        that.tabsSVC.printNotification('Error while deleting');
        that.setLoading(false);
      }
    );
  }
  btnTogglePugHelp(): void {
    this.showPugHelp = !this.showPugHelp;
  }
  setHasChanges(hasChanges): void {
    if (this.hasChanges !== hasChanges) {
      this.tabsSVC.setTabHasChanges(this.tabid, hasChanges);
      this.hasChanges = hasChanges;
    }
  }
  setLoading(on: boolean) {
    this.loading = on;
    this.tabsSVC.setLoading(on);
  }
}
