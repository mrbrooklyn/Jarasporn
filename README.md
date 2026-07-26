# จรัสพรหมูสด

แอปจัดการการขายและบัญชีสำหรับร้านขายส่งหมู ใช้งานแบบออฟไลน์ ข้อมูลอยู่ในเครื่องด้วย SQLite และสร้างเป็น Android APK ได้

## เทคโนโลยี

- Vue 3 + Vite + TypeScript
- Pinia และ Vue Router
- Capacitor สำหรับ Android
- `@capacitor-community/sqlite` สำหรับฐานข้อมูลในเครื่อง
- XLSX สำหรับส่งออกรายงาน Excel

## ความต้องการก่อนเริ่ม

ติดตั้งโปรแกรมต่อไปนี้:

1. [Node.js](https://nodejs.org/) เวอร์ชัน LTS
2. [Android Studio](https://developer.android.com/studio)
3. Android SDK Platform และ Android SDK Build-Tools ผ่าน Android Studio
4. JDK ที่ Android Studio ติดตั้งหรือกำหนดให้ใช้งาน

เปิด Android Studio แล้วไปที่ **More Actions → SDK Manager** และตรวจสอบว่าได้ติดตั้ง:

- Android SDK Platform อย่างน้อยหนึ่งเวอร์ชัน
- Android SDK Build-Tools
- Android SDK Command-line Tools

## เริ่มต้นใช้งาน

เปิด Terminal ในโฟลเดอร์โครงการ แล้วติดตั้ง dependencies:

```powershell
npm install
```

สำหรับทดสอบในเว็บเบราว์เซอร์:

```powershell
npm run dev
```

## เปิดใน Android Studio

ทุกครั้งที่แก้ไขโค้ดเว็บ ให้ build และ sync ไปยังโปรเจกต์ Android ก่อน:

```powershell
npm run cap:sync
```

จากนั้นเปิดโปรเจกต์ Android:

```powershell
npm run android
```

หรือเปิด Android Studio แล้วเลือก **Open** จากนั้นเลือกโฟลเดอร์:

```text
android
```

รอให้ Gradle Sync ทำงานจนเสร็จ แล้วเลือกอุปกรณ์จำลอง (Emulator) หรือโทรศัพท์ Android ที่เปิด USB Debugging จากแถบด้านบน กดปุ่ม ▶ Run เพื่อทดสอบแอป

## สร้าง APK

### วิธีผ่าน Android Studio

1. เปิดโฟลเดอร์ `android` ใน Android Studio
2. เลือกเมนู **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. รอการ build เสร็จ แล้วกด **locate**

ไฟล์ debug APK จะอยู่ที่:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### วิธีผ่าน Terminal

Build และ sync ไฟล์เว็บก่อน:



จากนั้นสร้าง debug APK:

```powershell
cd android
.\gradlew.bat assembleDebug
```

ไฟล์ APK จะอยู่ที่:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## สร้าง Release APK สำหรับแจกจ่าย

1. ใน Android Studio เปิด **Build → Generate Signed Bundle / APK**
2. เลือก **APK**
3. สร้างหรือเลือกไฟล์ Keystore และเก็บรหัสผ่านไว้ในที่ปลอดภัย
4. เลือก build variant `release`
5. Build เสร็จแล้วจะได้ signed APK ที่ติดตั้งหรือส่งให้ผู้ใช้งานได้

อย่า commit ไฟล์ Keystore หรือรหัสผ่านลงใน Git repository

## ปัญหาที่พบบ่อย

### `SDK location not found`

Android SDK ยังไม่ได้ตั้งค่า ให้เปิด Android Studio และทำตามนี้:

1. ไปที่ **File → Settings → Languages & Frameworks → Android SDK**
2. คัดลอกตำแหน่ง Android SDK
3. สร้างไฟล์ `android/local.properties` โดยใส่:

```properties
sdk.dir=C:\\Users\\ชื่อผู้ใช้\\AppData\\Local\\Android\\Sdk
```

ใช้ `\\` ใน Windows หรือแก้เป็นตำแหน่ง SDK จริงบนเครื่อง

### โค้ดเว็บไม่อัปเดตในแอป Android

ต้องรันคำสั่งนี้หลังแก้ไขโค้ดทุกครั้ง:

```powershell
npm run cap:sync
```

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ความหมาย |
| --- | --- |
| `npm run dev` | เปิดเว็บสำหรับพัฒนา |
| `npm run build` | ตรวจสอบ TypeScript และ build เว็บ production |
| `npm run cap:sync` | build เว็บและ copy ไปยัง Android |
| `npm run android` | sync และเปิด Android Studio |

## Run
```bash
npm install
npx run dev
```

## Build
```bash
npm run cap:sync
npx cap open android
```