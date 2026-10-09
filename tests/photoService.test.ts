import {test,expect} from 'vitest';
import {photoPath} from '../src/services/photoPolicy';
test('les anciens liens sont convertis en chemins privés sans réutiliser leur jeton',()=>{expect(photoPath('https://firebasestorage.googleapis.com/v0/b/test/o/organizations%2Forg%2Ffile.jpg?token=old','org')).toBe('organizations/org/file.jpg');expect(photoPath('organizations/other/file.jpg','org')).toBe('');expect(photoPath('javascript:alert(1)','org')).toBe('');expect(photoPath('https://foreign.example/image.jpg','org')).toBe('');});
