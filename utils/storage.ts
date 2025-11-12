/**
 * LocalStorage 데이터 관리 유틸리티
 */

export interface BackupData {
  version: string;
  timestamp: string;
  petState: any;
  apiKeys: any;
  exportedBy: string;
}

/**
 * 현재 펫 데이터를 JSON으로 백업
 */
export function exportPetData(): string {
  try {
    const petState = localStorage.getItem('ame-pet-state');
    const apiKeys = localStorage.getItem('ame-api-keys');

    const backup: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      petState: petState ? JSON.parse(petState) : null,
      apiKeys: apiKeys ? JSON.parse(apiKeys) : {},
      exportedBy: 'Saessak v1.0'
    };

    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('Failed to export pet data:', error);
    throw new Error('백업 데이터 생성에 실패했습니다.');
  }
}

/**
 * JSON 백업 파일로부터 데이터 복원
 */
export function importPetData(jsonString: string): BackupData {
  try {
    const backup: BackupData = JSON.parse(jsonString);

    // 버전 체크
    if (!backup.version) {
      throw new Error('잘못된 백업 파일 형식입니다.');
    }

    // 데이터 복원
    if (backup.petState) {
      localStorage.setItem('ame-pet-state', JSON.stringify(backup.petState));
    }

    if (backup.apiKeys) {
      localStorage.setItem('ame-api-keys', JSON.stringify(backup.apiKeys));
    }

    return backup;
  } catch (error) {
    console.error('Failed to import pet data:', error);
    throw new Error('백업 파일 복원에 실패했습니다. 파일 형식을 확인해주세요.');
  }
}

/**
 * 백업 데이터를 파일로 다운로드
 */
export function downloadBackup(): void {
  try {
    const jsonData = exportPetData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    
    link.href = url;
    link.download = `saessak-backup-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download backup:', error);
    alert('백업 파일 다운로드에 실패했습니다.');
  }
}

/**
 * 파일로부터 백업 데이터 업로드
 */
export function uploadBackup(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup = importPetData(content);
        resolve(backup);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('파일 읽기에 실패했습니다.'));
    };

    reader.readAsText(file);
  });
}

/**
 * 모든 데이터 삭제 (초기화)
 */
export function clearAllData(): void {
  if (confirm('⚠️ 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) {
    localStorage.removeItem('ame-pet-state');
    localStorage.removeItem('ame-api-keys');
    alert('✅ 모든 데이터가 삭제되었습니다. 페이지를 새로고침합니다.');
    window.location.reload();
  }
}
