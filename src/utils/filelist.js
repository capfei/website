// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT
import orderBy from 'lodash/orderBy'
import memoize from 'lodash/memoize'
import Contribution from './contribution'

// Abstract methods for FileList
let key = 0

// Name -> position lookup per sibling array. Without this, building the tree rescans the
// whole sibling list for every file, which is quadratic on components with many files.
const siblingIndexes = new WeakMap()

function indexFor(result) {
  let index = siblingIndexes.get(result)
  if (!index) {
    index = new Map()
    siblingIndexes.set(result, index)
  }
  return index
}

export default class FileListSpec {
  constructor() {
    this.pathToTreeFolders = memoize(this.pathToTreeFolders)
    this.getFolders = memoize(this.getFolders)
    this.getFileFacets = memoize(this.getFileFacets)
    this.getFileAttributions = memoize(this.getFileAttributions)
  }
  static pathToTreeFolders(files, component, preview) {
    if (!files) return []
    const newFiles = files.map((file, index) => {
      return { ...file, id: index, folders: file.path.split('/') }
    })
    const orderedFiles = orderBy(newFiles, [file => file.path.split('/').length, 'path'], ['desc', 'asc'])
    const treeFolders = orderedFiles.reduce((result, file) => {
      result = this.getFolders(file, result, component, preview, key)
      return result
    }, [])
    key = 0
    return treeFolders
  }

  static getFolders(file, result, component, preview) {
    if (!result) result = []
    const index = indexFor(result)
    if (file.folders.length === 1) {
      key++
      const name = file.folders[file.folders.length - 1]
      if (!index.has(name)) index.set(name, result.length)
      result.push({
        ...file,
        key,
        name,
        license: file.license || '',
        facets: this.getFileFacets(file.facets, component, preview, file.id),
        attributions: this.getFileAttributions(file.attributions, component, preview, file.id)
      })
    } else {
      const folderName = file.folders[0]
      file.folders.splice(0, 1)

      const existing = index.has(folderName) ? index.get(folderName) : -1
      if (existing !== -1) {
        result[existing].children = this.getFolders({ ...file }, result[existing].children, component, preview)
      } else {
        key++
        index.set(folderName, result.length)
        result.push({
          ...file,
          key,
          name: folderName,
          children: this.getFolders({ ...file }, [], component, preview)
        })
      }
    }
    return result
  }

  static getFileFacets(facets, component, preview, key) {
    if (!preview || !preview.files || !preview.files[key] || !preview.files[key].facets) {
      if (!facets) return []
      return facets.map(f => {
        return {
          value: f,
          isDifferent: false
        }
      })
    }
    const previewObject = Object.assign([], preview.files[key].facets)
    if (component.files[key].facets && previewObject.length >= component.files[key].facets.length) {
      component.files[key].facets.map(
        (attribution, index) => !previewObject[index] && (previewObject[index] = attribution)
      )
    }
    return previewObject.map((_, index) =>
      Contribution.getValueAndIfDifferent(component, preview, `files[${key}].facets[${index}]`)
    )
  }

  static getFileAttributions(attributions, component, preview, key) {
    if (!preview || !preview.files || !preview.files[key] || !preview.files[key].attributions) {
      if (!attributions) return
      return Object.assign([], attributions).map(f => {
        return {
          value: f,
          isDifferent: false
        }
      })
    }
    const previewObject = Object.assign([], preview.files[key].attributions)
    if (component.files[key].attributions && previewObject.length >= component.files[key].attributions.length) {
      component.files[key].attributions.map(
        (attribution, index) => !previewObject[index] && (previewObject[index] = attribution)
      )
    }
    return previewObject.map((_, index) =>
      Contribution.getValueAndIfDifferent(component, preview, `files[${key}].attributions[${index}]`)
    )
  }

  static getFilesKeys(files) {
    const memoizedFlattenList = memoize(files => {
      return files.reduce((acc, x) => {
        acc = acc.concat(x)
        if (x.children) {
          acc = acc.concat(memoizedFlattenList(x.children))
        }
        return acc
      }, [])
    })
    const flattenList = memoizedFlattenList(files)
    return flattenList.map(item => item.children && item.key).filter(x => x)
  }
}
