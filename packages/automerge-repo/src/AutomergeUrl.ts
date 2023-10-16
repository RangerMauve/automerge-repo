import {
  type AutomergeUrl,
  type BinaryDocumentId,
  type DocumentId,
} from "./types.js"
import * as Uuid from "uuid"
import bs58check from "bs58check"

export const urlPrefix = "automerge:"

/** Given an Automerge URL, returns the DocumentId in both base58check-encoded form and binary form */
export const parseAutomergeUrl = (url: AutomergeUrl) => {
  const regex = new RegExp(`^${urlPrefix}(\\w+)$`)
  const [_, docMatch] = url.match(regex) || []
  const documentId = docMatch as DocumentId
  const binaryDocumentId = documentIdToBinary(documentId)

  if (!binaryDocumentId) throw new Error("Invalid document URL: " + url)
  return {
    /** unencoded DocumentId */
    binaryDocumentId,
    /** encoded DocumentId */
    documentId,
  }
}

/**
 * Given a documentId in either binary or base58check-encoded form, returns an Automerge URL.
 * Throws on invalid input.
 */
export const stringifyAutomergeUrl = (
  arg: UrlOptions | DocumentId | BinaryDocumentId
) => {
  let documentId =
    arg instanceof Uint8Array || typeof arg === "string"
      ? arg
      : "documentId" in arg
      ? arg.documentId
      : undefined

  const encodedDocumentId =
    documentId instanceof Uint8Array
      ? binaryToDocumentId(documentId)
      : typeof documentId === "string"
      ? documentId
      : undefined

  if (encodedDocumentId === undefined)
    throw new Error("Invalid documentId: " + documentId)

  return (urlPrefix + encodedDocumentId) as AutomergeUrl
}

/**
 * Given a string, returns true if it is a valid Automerge URL. This function also acts as a type
 * discriminator in Typescript.
 */
export const isValidAutomergeUrl = (
  str: string | undefined | null
): str is AutomergeUrl => {
  if (!str || !str.startsWith(urlPrefix)) return false
  const automergeUrl = str as AutomergeUrl
  try {
    parseAutomergeUrl(automergeUrl)
    return true
  } catch {
    return false
  }
}

/**
 * Returns a new Automerge URL with a random UUID documentId. Called by create(), and also used by tests.
 */
export const generateAutomergeUrl = (): AutomergeUrl => {
  const documentId = Uuid.v4(null, new Uint8Array(16)) as BinaryDocumentId
  return stringifyAutomergeUrl({ documentId })
}

export const documentIdToBinary = (docId: DocumentId) =>
  bs58check.decodeUnsafe(docId) as BinaryDocumentId | undefined

export const binaryToDocumentId = (docId: BinaryDocumentId) =>
  bs58check.encode(docId) as DocumentId

export const parseLegacyUUID = (str: string) => {
  if (!Uuid.validate(str)) return undefined
  const documentId = Uuid.parse(str) as BinaryDocumentId
  return stringifyAutomergeUrl({ documentId })
}

type UrlOptions = {
  documentId: DocumentId | BinaryDocumentId
}
