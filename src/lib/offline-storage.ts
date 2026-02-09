/**
 * Utilidad para almacenamiento offline usando IndexedDB
 * Permite guardar datos cuando no hay conexión y sincronizarlos después
 */

const DB_NAME = 'AppVotacionesOfflineDB'
const DB_VERSION = 1
const STORE_NAME = 'pendingReports'

interface PendingReport {
    id: string
    type: 'voter' | 'witness' | 'table'
    data: any
    timestamp: number
}

class OfflineStorage {
    private db: IDBDatabase | null = null

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                this.db = request.result
                resolve()
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBRequest).result
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' })
                }
            }
        })
    }

    async savePendingReport(report: Omit<PendingReport, 'id' | 'timestamp'>): Promise<string> {
        if (!this.db) await this.init()

        const id = `${report.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const fullReport: PendingReport = {
            ...report,
            id,
            timestamp: Date.now()
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.add(fullReport)

            request.onsuccess = () => resolve(id)
            request.onerror = () => reject(request.error)
        })
    }

    async getPendingReports(): Promise<PendingReport[]> {
        if (!this.db) await this.init()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.getAll()

            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async deletePendingReport(id: string): Promise<void> {
        if (!this.db) await this.init()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.delete(id)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    async syncPendingReports(): Promise<{ success: number; failed: number }> {
        const reports = await this.getPendingReports()
        let success = 0
        let failed = 0

        for (const report of reports) {
            try {
                // Determinar el endpoint según el tipo
                let endpoint = ''
                switch (report.type) {
                    case 'voter':
                        endpoint = '/api/auth/register'
                        break
                    case 'witness':
                        endpoint = '/api/witnesses/register'
                        break
                    case 'table':
                        endpoint = '/api/tables/report'
                        break
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(report.data)
                })

                if (response.ok) {
                    await this.deletePendingReport(report.id)
                    success++
                } else {
                    failed++
                }
            } catch (error) {
                failed++
                console.error(`Failed to sync report ${report.id}:`, error)
            }
        }

        return { success, failed }
    }
}

export const offlineStorage = new OfflineStorage()
