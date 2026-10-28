> Historical specification. On2026-10-28 the user explicitly removed native AR and authorized one SDK58 Expo Go photo-studio application. README.md, docs/ARCHITECTURE.md and docs/FIVE_MEMBER_HANDOVER.md define the current scope. Original AR/Firebase requirements below are retained as history, not instructions to restore removed features. Strict TypeScript, real test evidence and secret/private-photo protections still apply.

# ARTSPACE AR — ONE-FILE CODEX MASTER BUILD SPEC

> **Document ID:** `ARTSPACE_AR_CODEX_FULL_BUILD.md`  
> **Version:** 2.0 · 27/10/2026  
> **Project:** ArtSpace AR — Virtual Wall Art Preview  
> **Course:** MMA301, FPT University  
> **Stack:** React Native · Expo · TypeScript · ViroReact/ARCore · Firebase  
> **Execution:** **ONE CODEX AGENT BUILDS THE ENTIRE PROJECT FROM SCRATCH TO ANDROID APK.**  
> **Audience:** Codex coding agent; sau khi code xong, nhóm 5 người nhận các module để kiểm thử, sửa lỗi và trình bày.

---

## 0. EXECUTION DIRECTIVE — ĐỌC TRƯỚC KHI CODE

**Đây là tài liệu duy nhất đủ dùng để CodeX triển khai toàn bộ project.** Đặt tại root repo dưới tên `ARTSPACE_AR_CODEX_FULL_BUILD.md`. Trong trường hợp repo có `AGENTS.md` hoặc các tài liệu/role cũ mâu thuẫn về quyền chỉnh sửa file, quy tắc **single-agent** bên dưới là quy tắc điều phối của dự án mới; không áp dụng các lệnh cấm `M1/M2/M3/M4/M5` sửa file của nhau. Codex có thể tạo/điều chỉnh `AGENTS.md` trong repo để ghi lại các quy tắc tương thích, không xoá chỉ dẫn Expo có ích nếu không gây xung đột.

### 0.1. System role cho Codex

Bạn là **Principal Mobile Engineer + AR Engineer + Firebase Architect + QA Lead** chịu trách nhiệm **code, tích hợp, test, viết tài liệu và chuẩn bị APK**. Bạn được quyền tạo/chỉnh sửa toàn bộ source code, native config, Firebase rules, tests, docs và scripts trong repository. Không yêu cầu phân việc cho 5 người trong lúc code.

### 0.2. Hành vi làm việc bắt buộc

1. **Đọc hết** file này trước khi tạo project. Audit repo đầu tiên: repo trống thì scaffold, có source thì bảo toàn và migrate có kiểm soát; không overwrite dữ liệu vô cớ.
2. **Chạy theo thứ tự Phase 00 → 12**. Sau mỗi phase, chạy test thực tế, ghi `docs/PROGRESS.md` (PASS/FAIL/BLOCKED/UNVERIFIED), quyết định phase kế tiếp bằng dependency graph. **Tự tiếp tục tới cuối** khi có thể; không dừng xin phép qua mỗi phase.
3. Với công việc cần **credential, Firebase project, Expo account, billing hoặc máy Android thật**, không tự tạo credential giả, không tự kích hoạt dịch vụ có phí, không claim đã test. Viết hướng dẫn thao tác của con người vào `docs/NEEDS_USER_ACTION.md`; tiếp tục các phần độc lập và dùng adapter local/mock đã thiết kế (mock chỉ hợp lệ ở development/test).
4. **Code thực**, không tạo hàng loạt stub/TODO được coi là hoàn thành. Không thay AR bằng overlay 2D rồi gọi là AR. Nếu phần AR còn chưa xác minh trên máy thật, mọi báo cáo phải ghi `AR_DEVICE_UNVERIFIED`; ứng dụng có thể build nhưng **không được ghi ACCEPTED**.
5. Cứ kết thúc một phase phải kiểm tra `tsc`, ESLint, automated tests phù hợp, `expo-doctor` tại các mốc native; không sử dụng `--force` / `--legacy-peer-deps` để giấu lỗi dependency.
6. Tạo bản thân source với **5 module tách bạch** chỉ để bàn giao sau cùng; **không đặt file ownership restriction** lúc Codex làm việc. Giữ API contracts rõ ràng, UI và AR không truy vấn Firebase trực tiếp.
7. Ưu tiên Android trước; không cần iOS, website, thanh toán, cart, AI recommendations, người dùng nhiều thiết bị chia sẻ anchor.
8. Nếu thời lượng phiên Codex bị giới hạn, cập nhật `docs/PROGRESS.md` / `docs/NEXT_STEPS.md`, nêu lệnh tiếp tục; không bỏ mất công việc đã làm. Không hứa chạy nền.
9. Kết thúc: source buildable, APK nếu môi trường có EAS credential, Firebase Rules, seed/mock catalogue, tests, setup, known limitations, evidence tests, **bảng mapping source → 5 người**.

### 0.3. Definition of success

- **CODE_READY:** code + dependency được typecheck/lint/test; launch paths, fallback, rules/config hợp lệ.
- **AR_VERIFIED:** cầm máy Android có ARCore, scan vertical wall, tap place, tracking, resize, screenshot và reset hoạt động thực tế.
- **CLOUD_VERIFIED:** cấu hình Firebase thật, Auth/Firestore và nếu bật Storage thì cloud upload/delete + rules tests được kiểm chứng.
- **RELEASE_VERIFIED:** APK preview được build, cài và mở **không chạy Metro**, các luồng MVP pass.
- **FULLY_ACCEPTED:** bốn mục trên PASS hoặc chỉ rõ tính năng Storage local-only được chọn là phạm vi thay thế công khai. Chưa kiểm tra vật lý/credential → báo `UNVERIFIED`, tuyệt đối không tự đánh dấu PASS.

### 0.4. Lệnh bắt đầu để người vận hành dán vào Codex

```text
Read ARTSPACE_AR_CODEX_FULL_BUILD.md completely. Act as the sole senior engineer for ArtSpace AR. Implement the full project from a blank repository (or safely audit existing code), follow phases 00–12 in dependency order, and continue autonomously as far as actual environment and permissions allow. You may edit any project file. Do not split work by team member. After every phase run real checks, update docs/PROGRESS.md, document blockers in docs/NEEDS_USER_ACTION.md, and continue independent tasks. Do not claim AR/device, Firebase/billing, or APK passes without actual evidence. At the end provide modified files, checks, build instructions, unsatisfied gates, and a five-module handover map.
```

---

## 1. QUYẾT ĐỊNH KỸ THUẬT BẮT BUỘC

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| Platform | Android-first | Phạm vi thực tế cho MMA301; iOS là ngoài MVP |
| Language | TypeScript strict | Giảm lỗi tích hợp 5 nhánh |
| App | React Native + Expo Router | Phù hợp yêu cầu môn và navigation |
| Expo | **SDK 57 (khóa theo bản tương thích thực tế)** | Expo SDK 58 mới hơn nhưng chưa nằm trong dải hỗ trợ đã công bố của ViroReact |
| AR | `@reactvision/react-viro` **3.0.3** + ARCore | AR thật nhận diện mặt phẳng thẳng đứng |
| Runtime | Expo Development Build / EAS Build | **Không sử dụng Expo Go để chạy AR** |
| Backend | Firebase JS SDK (modular) | Auth, Firestore, có thể dùng Storage |
| Image storage | Firebase Storage khi có Blaze/billing; adapter local-only khi không có | Không giả vờ có đồng bộ cloud nếu chỉ lưu local |
| State | React Context + feature hooks; tránh thêm state library nếu không cần | Giảm phụ thuộc |
| Testing | Jest + React Native Testing Library (nếu tương thích SDK) + thủ công máy thật | AR không thể nghiệm thu bằng unit test |
| Package manager | npm, commit `package-lock.json` | Build tái lập được |
| Release | EAS Android preview APK | Cài trực tiếp để demo, không phụ thuộc Metro |

**Kiểm chứng phiên bản tại thời điểm triển khai:** Codex chạy `npm view @reactvision/react-viro@3.0.3 peerDependencies`, đối chiếu `expo` / `react-native`, khóa vào `package-lock.json`. **Không** tự chuyển SDK 58 chỉ vì là bản Expo mới hơn. Starter: https://github.com/ReactVision/expo-starter-kit-typescript (cần rà soát version starter, không tin mặc định là mới nhất).

**Tài liệu kỹ thuật chuẩn:**
- ViroReact + Expo: https://viro-community.readme.io/docs/integrating-with-expo
- ViroARPlaneSelector: https://viro-community.readme.io/docs/viroarplaneselector
- ViroARSceneNavigator/screenshot: https://viro-community.readme.io/docs/viroarscenenavigator
- Expo Firebase: https://docs.expo.dev/guides/using-firebase/
- Expo APK: https://docs.expo.dev/build-reference/apk/
- ARCore devices: https://developers.google.com/ar/devices
- Firebase Storage prerequisites: https://firebase.google.com/docs/storage/web/start

### 1.1. Các quyết định chống scope creep

- **MVP** chỉ cho đặt **1 tranh mỗi phiên AR**; chỉ một mặt phẳng tường được chọn.
- Không cần shopping cart/payment, đo đạc chính xác bằng AI, chat, recommendation AI, multi-user AR, VPS, persistent cloud anchor hoặc VR.
- Không bắt buộc tạo Admin UI. Seed tranh bằng script dùng môi trường quản trị an toàn hoặc thao tác Firebase Console.
- Cho Guest xem gallery/detail/thử AR/chụp preview; yêu cầu login cho favorites và cloud save.
- Không tự động lưu lại tọa độ AR qua lần mở app; Saved Design là **ảnh chụp** + metadata.
- Nếu thiết bị không hỗ trợ ARCore, hiển thị thông báo rõ ràng và quay lại Gallery; tùy chọn mock 2D **phải gắn nhãn “2D Preview”**, không nhận là AR.
- iOS và các tính năng custom artwork/khung cao cấp là **stretch goals**, sau khi MVP pass toàn bộ.

---

## 2. PRODUCT REQUIREMENTS

### 2.1. Product vision

Khách hàng muốn biết tranh có hợp bức tường, kích thước và bố cục trong nhà trước khi mua/trang trí. ArtSpace AR dùng camera điện thoại và ARCore để cho phép chọn tranh, gắn vào mặt phẳng tường, quan sát từ các góc nhìn, thay đổi kích thước và lưu hình kết quả.

### 2.2. Actors, quyền truy cập

| Khả năng | Guest | Authenticated User | Content Admin |
|---|:---:|:---:|:---:|
| Xem/search/filter tranh đã publish | ✅ | ✅ | ✅ |
| Xem chi tiết tranh | ✅ | ✅ | ✅ |
| Xem tranh trên tường bằng AR | ✅ | ✅ | ✅ |
| Đổi tranh/scale/reposition trong AR | ✅ | ✅ | ✅ |
| Chụp preview, lưu ảnh tạm/local | ✅ | ✅ | ✅ |
| Favorite | Yêu cầu login | ✅ | ✅ |
| Cloud-save Saved Design | Yêu cầu login | ✅ nếu Storage được bật | ✅ |
| Quản lý profile | — | ✅ | ✅ |
| Publish/ẩn/sửa catalogue | — | — | Qua Console/Admin seed |

### 2.3. Functional requirements (FR)

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-01 | Đăng ký bằng email/password | MUST | Email hợp lệ, lỗi thân thiện; lưu profile |
| FR-02 | Login, logout, giữ phiên | MUST | Đăng nhập lại không cần nhập mật khẩu trừ khi logout |
| FR-03 | Gallery có ít nhất 12 tranh mẫu hợp pháp | MUST | Hiện title, thumbnail, category |
| FR-04 | Search theo tên; filter category | MUST | Có empty state, không crash khi không có kết quả |
| FR-05 | Artwork detail | MUST | Title, mô tả, kích thước cm, CTA View in AR |
| FR-06 | Guest preview | MUST | Không cưỡng ép login trước khi thử AR |
| FR-07 | Xin quyền camera, kiểm tra hỗ trợ AR | MUST | Có permission denied/unsupported state |
| FR-08 | Nhận diện vertical plane | MUST | Tường đủ texture/ánh sáng được phát hiện trên máy thật |
| FR-09 | Chạm chọn vị trí và đặt tranh | MUST | Ảnh bám tương đối ổn định khi đổi góc nhìn |
| FR-10 | Resize đồng tỷ lệ | MUST | Không méo ảnh, điều khiển min-max |
| FR-11 | Thay tranh hiện tại | MUST | Giữ phiên AR, thay texture khi asset hợp lệ |
| FR-12 | Reposition/reset | MUST | Có khả năng chọn lại vị trí khi đặt sai |
| FR-13 | Capture AR Preview | MUST | Tạo file có cảnh camera và tranh ảo (kiểm thử thật) |
| FR-14 | Xem preview, retake, lưu | MUST | Trạng thái rõ ràng, lỗi có retry |
| FR-15 | Favorites riêng theo UID | MUST | Thêm/xóa, user khác không thấy |
| FR-16 | Saved Designs list/detail/delete | MUST | Lưu thông tin, không tạo file mồ côi khi xóa |
| FR-17 | Profile | MUST | Hiển thị/chỉnh displayName, logout |
| FR-18 | Quản lý catalogue | MUST | Admin seed/console, mobile user không sửa được |
| FR-19 | Ảnh cá nhân -> tranh AR | SHOULD | Chỉ làm sau MUST; xử lý ảnh local URI |
| FR-20 | 3 khung ảnh có thể chọn | SHOULD | Không cản trở tracking |
| FR-21 | Share ảnh ra ứng dụng khác | COULD | Không làm nếu ảnh capture chưa ổn |

**Chú ý FR-13:** `takeScreenshot()` của ViroARSceneNavigator được mô tả là chụp các thành phần Viro-rendered; kiểm tra ảnh đầu ra có camera thực và tranh ảo. Overlay React Native riêng có thể không nằm trong ảnh. Không dùng `ViewShot` theo suy đoán cho native camera/GL mà không thử nghiệm.

### 2.4. Non-functional requirements (NFR)

- NFR-01: Android thật tương thích ARCore, không claim test emulator là test AR.
- NFR-02: TypeScript `strict: true`; không dùng `any` tùy tiện; ESLint hoạt động.
- NFR-03: Các màn hình gallery/profile vẫn hoạt động khi AR unsupported.
- NFR-04: Mọi network request đều có loading, error, empty và retry khi phù hợp.
- NFR-05: AR không ghi Firestore trên mỗi frame; tránh setState toàn app trên mỗi anchor update.
- NFR-06: Images có placeholder/fallback; giữ tỷ lệ và kích thước theo **mét trong scene**.
- NFR-07: Rules ngăn user đọc/ghi dữ liệu người khác, upload sai MIME/quá dung lượng.
- NFR-08: Không hardcode API secret, service-account hoặc khóa server; `.env` có mẫu, `.env.local` ignore.
- NFR-09: Có test tự động cho pure logic/repository use cases, smoke test máy thật cho AR.
- NFR-10: APK preview release độc lập chạy không cần Metro; không bị màn hình trắng.
- NFR-11: UI thống nhất spacing, font, màu, accessibility label, cỡ chạm phù hợp.
- NFR-12: Không yêu cầu đăng nhập để thử AR; hạn chế thu thập dữ liệu người dùng.

### 2.5. User journey chuẩn

1. Mở ứng dụng → Home/Gallery.
2. Chọn tranh → Artwork Detail (hiện widthCm, heightCm) → `View in AR`.
3. Kiểm tra thiết bị/quyền camera → AR scene mở → hướng dẫn lia camera.
4. Hệ thống detect vertical plane → user tap tường → tranh xuất hiện đúng mặt phẳng.
5. User resize, đổi tranh hoặc reset/chọn lại vị trí.
6. User capture → preview ảnh chụp → Retake hoặc Save.
7. Guest muốn cloud-save → Login → quay lại draft đã chụp; signed-in user lưu ngay.
8. Saved Designs → mở ảnh/metadata; có thể xóa sau xác nhận.

### 2.6. Màn hình / routes bắt buộc

`/(tabs)` Home/Gallery, Favorites, Saved Designs, Profile; `/artwork/[id]`; `/ar/[id]`; `/design/[id]`; `/login`; `/register`; `/capture-preview` (nếu dùng route riêng); loading/not-found/errors. Tránh thêm navigation stack lồng không cần thiết.

---

## 3. KIẾN TRÚC & CONTRACTS

```text
┌───────────────────────────────────────────────────────┐
│ M1 Expo Router / Screens / Design System              │
│   imports M4 Feature Screens + M2 ARViewer             │
└───────────────────────────────────────────────────────┘
            │                               │
            v                               v
┌──────────────────────────┐   ┌────────────────────────┐
│ M4 Features + Use Cases  │   │ M2 AR Scene / ViroReact│
│  Auth/Gallery/Favorite   │   │ Plane/Anchor/Controls  │
│  SavedDesign/Profile     │   │ Capture & Preview      │
└──────────────────────────┘   └────────────────────────┘
            │                               │
            v                               │ props/callbacks
┌──────────────────────────┐               │
│ M4 Domain Interfaces     │<──────────────┘
│ Entities / Validators    │
└──────────────────────────┘
            ^
            │ implements
┌──────────────────────────┐
│ M3 Firebase / Local Data │
│ Auth / Firestore/Storage │
└──────────────────────────┘
            ^
            │ wiring, providers, config, tests
┌──────────────────────────┐
│ M5 Bootstrap / QA / CI   │
└──────────────────────────┘
```

### 3.1. Domain models (contract freeze ở PHASE 02)

```ts
export type ArtworkStatus = 'published' | 'hidden';
export type SourceKind = 'catalog' | 'custom';
export type FrameStyle = 'none' | 'black' | 'white';
export type StorageMode = 'cloud' | 'local';

export interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  imageUrl: string;
  thumbnailUrl: string;
  widthCm: number;
  heightCm: number;
  isFeatured: boolean;
  status: ArtworkStatus;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string; // ISO UTC ở domain; adapter Firebase tự map Timestamp
  updatedAt: string;
}

export interface Favorite {
  artworkId: string;
  createdAt: string;
}

export interface SavedDesign {
  id: string;
  userId: string;
  artworkId: string | null;
  sourceKind: SourceKind;
  sourceImageUri: string | null; // local custom source nếu có
  capturedImageUri: string; // URI render được; cloud URL hoặc file local
  imageStoragePath: string | null; // Storage path nội bộ khi cloud
  storageMode: StorageMode;
  widthCm: number;
  heightCm: number;
  scaleFactor: number;
  frameStyle: FrameStyle;
  createdAt: string;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };
export interface AppError {
  code: string;
  message: string;
  retryable: boolean;
}
```

**Rule:** Không lưu `anchorId` hoặc world transform như thể có thể khôi phục qua phiên AR khác. `capturedImageUri` trong local mode chỉ hợp lệ trên cùng thiết bị; khi không còn file phải báo missing image, không crash. Tất cả ngày trong domain là ISO UTC; Firestore mapping ở data adapter.

### 3.2. Repository interfaces (đóng băng sau PHASE 02)

Đặt ở `src/domain/repositories/`; adapter **implements** tại `src/data/`:

```ts
interface AuthRepository {
  getCurrentUser(): Promise<UserProfile | null>;
  signIn(email: string, password: string): Promise<Result<UserProfile>>;
  signUp(email: string, password: string, displayName: string): Promise<Result<UserProfile>>;
  signOut(): Promise<Result<void>>;
  updateProfile(displayName: string): Promise<Result<UserProfile>>;
  observeAuth(callback: (user: UserProfile | null) => void): () => void;
}
interface ArtworkRepository {
  listPublished(): Promise<Result<Artwork[]>>;
  getPublishedById(id: string): Promise<Result<Artwork | null>>;
  listCategories(): Promise<Result<Category[]>>;
}
interface FavoriteRepository {
  list(userId: string): Promise<Result<Favorite[]>>;
  add(userId: string, artworkId: string): Promise<Result<void>>;
  remove(userId: string, artworkId: string): Promise<Result<void>>;
}
interface SavedDesignRepository {
  list(userId: string): Promise<Result<SavedDesign[]>>;
  getById(userId: string, id: string): Promise<Result<SavedDesign | null>>;
  create(userId: string, input: SavedDesign): Promise<Result<SavedDesign>>;
  delete(userId: string, id: string): Promise<Result<void>>;
}
interface CaptureStorage {
  saveCapture(userId: string, designId: string, fileUri: string): Promise<Result<{
    capturedImageUri: string;
    imageStoragePath: string | null;
    storageMode: StorageMode;
  }>>;
  removeCapture(userId: string, designId: string, imageStoragePath: string | null): Promise<Result<void>>;
}
```

`Result` là hợp đồng ở tầng use case và repository. Đổi interface phải có thay đổi đồng bộ ở adapter, use cases, tests và ghi ADR. Không để `firebase/firestore` hoặc `firebase/auth` import trong UI, AR hoặc domain/feature layer.

### 3.3. AR contract (dùng thống nhất toàn ứng dụng)

```ts
interface ARArtworkInput {
  id: string;
  imageUri: string;         // file URI đã cache hoặc remote uri được test
  widthCm: number;
  heightCm: number;
}

type ARStatus = 'initializing' | 'scanning' | 'wall-found'
  | 'placed' | 'adjusting' | 'capturing' | 'captured' | 'error';

interface ARPlacementState {
  status: ARStatus;
  artwork: ARArtworkInput;
  scaleFactor: number;
  frameStyle: FrameStyle;
  wallSelected: boolean;
  errorMessage?: string;
}

interface ARViewerProps {
  artwork: ARArtworkInput;
  onBack: () => void;
  onCapture: (fileUri: string, placement: {
    artworkId: string;
    scaleFactor: number;
    widthCm: number;
    heightCm: number;
    frameStyle: FrameStyle;
  }) => void;
  onError: (message: string) => void;
}
```

Dữ liệu ảnh tải Firebase được xử lý/cache **ngoài scene**. AR module chỉ nhận props và phát callback; không dùng SDK Firebase.

### 3.4. Đơn vị và giới hạn thao tác AR

- `1 Viro world unit ≈ 1 mét`; `widthMeters = widthCm / 100 * scaleFactor`.
- Clamp `scaleFactor` mặc định `[0.5, 2.0]`, giữ cùng tỷ lệ ngang/dọc.
- Đặt tranh cách bề mặt vài mm đến 1 cm để hạn chế z-fighting; thử hướng normal thực tế.
- Reposition/reset là MUST; drag trên tường là SHOULD nếu hit testing/ràng buộc mặt phẳng phức tạp; nếu không ổn định, ưu tiên `tap to re-place`.
- Detect `PlanesVertical`; `ViroARPlaneSelector` **phiên bản mới phải forward `onAnchorFound`, `onAnchorUpdated`, `onAnchorRemoved` bằng ref**. Không copy API cũ.
- Khi camera permission denied hoặc AR unsupported, không crash; có hướng dẫn Settings/Back.
- Tắt debug wireframe trước release.

---

## 4. DATABASE, STORAGE & SECURITY

### 4.1. Firestore schema

```text
categories/{categoryId}
  name: string
  slug: string
  order: number

artworks/{artworkId}
  title: string
  description: string
  categoryId: string
  imageUrl: string
  thumbnailUrl: string
  widthCm: number
  heightCm: number
  status: 'published' | 'hidden'
  isFeatured: boolean
  createdAt: Timestamp
  updatedAt: Timestamp

users/{uid}
  email: string
  displayName: string
  avatarUrl: string | null
  createdAt: Timestamp
  updatedAt: Timestamp

users/{uid}/favorites/{artworkId}
  artworkId: string
  createdAt: Timestamp

users/{uid}/savedDesigns/{designId}  # chỉ cloud-enabled mode
  artworkId: string | null
  sourceKind: 'catalog' | 'custom'
  imageStoragePath: string
  widthCm: number
  heightCm: number
  scaleFactor: number
  frameStyle: 'none' | 'black' | 'white'
  createdAt: Timestamp
```

**Local-only mode:** lưu `SavedDesign` và file ảnh trong thiết bị bằng `LocalSavedDesignRepository`; KHÔNG ghi document Firestore chứa `file://` rồi gọi đó là cloud sync. Trong UI có nhãn “Lưu trên thiết bị này”. `cloud` mode chỉ bật sau khi Firebase Storage sẵn sàng, Security Rules và upload/download pass.

**SavedDesign IDs:** tạo UUID trước khi upload; Storage object và Firestore doc dùng cùng `designId`; nếu upload thành công/Firestore thất bại, cleanup hoặc đánh dấu orphan để retry. Khi xóa, cần xóa metadata và ảnh, hiển thị retry khi một bước thất bại.

### 4.2. Storage paths

```text
artworks/{artworkId}/original.jpg       # catalogue public read, admin write
artworks/{artworkId}/thumbnail.jpg      # catalogue public read, admin write
designs/{uid}/{designId}.jpg            # owner read/write
user_uploads/{uid}/{customId}.jpg       # stretch goal
```

Giới hạn ví dụ: JPEG/PNG/WebP do client và backend hỗ trợ; 10 MB/ảnh upload cá nhân; không upload RAW hoặc quá kích thước. Cấu hình exact content type và rule được kiểm chứng qua Firebase Emulator Suite hoặc sandbox project.

### 4.3. Firestore/Storage Security Rules

Codex phải viết rules thực tế cho CRUD, validate fields, owner UID, published-only read, deny writes catalogue từ client. Admin seed chạy ngoài mobile qua môi trường quản trị, **không đưa Admin SDK/service account lên thiết bị**.

**Cảnh báo Firestore:** security rules không tự lọc kết quả; catalogue query bắt buộc `where('status','==','published')`. Không đưa filter search phức tạp lên Firestore nếu dataset 12–50 tranh; tải catalogue đã published rồi filter client để giảm composite indexes.

**Bắt buộc test Rules:** guest không viết favorites; A không xem savedDesign của B; user không viết artworks; user không upload vào `designs/otherUID/`; file sai MIME/big file bị chặn.

### 4.4. Firebase configuration & billing

- Đăng ký **Firebase Web App** để nhận JS SDK config; điều này đúng cả khi client là Android React Native dùng Firebase JS SDK.
- Chỉ public config (`EXPO_PUBLIC_FIREBASE_API_KEY`...) ở app; đây không phải service-account secret. Bảo mật thực sự bằng Authentication, Rules, App Check nếu cần.
- Không log email/password/token; không commit service-account key.
- Firebase Cloud Storage yêu cầu dự án Blaze tại thời điểm lập tài liệu. **Không bật billing nếu chưa được chủ dự án/giảng viên đồng ý**; dùng local-only fallback rõ ràng.

---

## 5. NĂM NHÓM MODULE LOGIC — KHÔNG PHẢI GIAO VIỆC TRƯỚC

> **Một Codex implement tất cả.** Số 1–5 chỉ dùng chia trách nhiệm sau khi hoàn thiện. Không cần tạo 5 repo, 5 app, 5 branch, 5 gói build riêng. Tất cả chạy trong **một ứng dụng Expo** với một Firebase project.

| Module bàn giao sau | Chức năng | Source trọng tâm | Tiêu chuẩn hoàn thành |
|---|---|---|---|
| **M1 UI & Navigation** | Design system, routes, Login/Register, Gallery, Detail, Favorites, Saved, Profile, AR overlay controls | `app/**`, `src/ui/**` | Screen responsive, navigation đúng, states đủ |
| **M2 AR Engine** | Device checks, permissions, plane detection, positioning, textures, resizing, retake, screenshot | `src/features/ar/**` | AR thật trên Android, không giả overlay |
| **M3 Firebase & Storage** | Firebase init, Auth persistence, Firestore repositories, security rules, seed, local/cloud adapters | `src/data/**`, `src/infra/**`, `firebase/**`, `scripts/**` | Rules đúng, modes minh bạch, no secrets |
| **M4 Domain & Business Logic** | Models, interfaces, validators, Auth/Gallery/Favorite/Design/Profile use cases and hooks | `src/domain/**`, `src/features/{auth,gallery,artwork,favorites,designs,profile}/**` | Thuần nghiệp vụ, dễ test, không import SDK trực tiếp |
| **M5 Integration, QA & Release** | Bootstrap/DI, root configs, tests, EAS, setup, build, security/performance, docs | `src/bootstrap/**`, `src/config/**`, `tests/**`, `docs/**`, root configs | End-to-end hoạt động, APK installable |

### 5.1. Phân định code và integration

- Routes (`app/**`) chỉ đọc route params, gọi feature screen/hook, truyền `artworkId` đúng dạng, quản lý nav. Đừng nhồi Firestore queries vào route.
- `src/domain` chứa types, repository contracts và validators độc lập React/Firebase. `src/features/ar` không import Firebase.
- `src/data` implement các interface domain cho Firebase, fake development và local persistence (theo mode).
- `src/bootstrap` bind repository implementations vào provider/container; React hooks chỉ dùng abstractions.
- UI overlay riêng AR scene; Viro scene chạy native. AR có thể dùng state tối thiểu/refs cho events tần suất cao, không sync Firestore theo frame.
- Design mode rõ ràng: `cloud` hoặc `local`. Cloud mode chỉ bật khi backend/Storage thực sự hoạt động; local mode không bao giờ nói được sync qua các máy.
- Ở cuối ghi `docs/FIVE_MEMBER_HANDOVER.md` với source paths, dependencies, cách test và lời giải thích kỹ thuật để từng người hiểu module nhận bàn giao. Nhóm quyết định ghi nhận đóng góp theo công việc thực tế sau bàn giao.

---

## 6. SOURCE TREE MỤC TIÊU (CODEX CÓ QUYỀN SỬA TẤT CẢ)

```text
artspace-ar/
├── ARTSPACE_AR_CODEX_FULL_BUILD.md
├── AGENTS.md                         # Codex tạo bản tóm lược quy tắc nếu cần
├── README.md
├── package.json
├── package-lock.json
├── app.config.ts                      # hoặc app.json, chọn 1 nguồn config
├── eas.json
├── tsconfig.json
├── eslint.config.js
├── .env.example
├── .gitignore
├── app/
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                # Home / Gallery
│   │   ├── favorites.tsx
│   │   ├── saved.tsx
│   │   └── profile.tsx
│   ├── artwork/[id].tsx
│   ├── ar/[id].tsx
│   ├── capture-preview.tsx
│   └── design/[id].tsx
├── src/
│   ├── bootstrap/
│   │   ├── AppProviders.tsx
│   │   └── repositories.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── featureFlags.ts
│   ├── domain/
│   │   ├── models/{artwork,category,user,favorite,design}.ts
│   │   ├── repositories/{AuthRepository,ArtworkRepository,FavoriteRepository,SavedDesignRepository,CaptureStorage}.ts
│   │   ├── errors.ts
│   │   ├── result.ts
│   │   └── validators.ts
│   ├── ui/
│   │   ├── theme/{colors,spacing,typography}.ts
│   │   ├── components/{AppButton,AppInput,ArtworkCard,EmptyState,ErrorState,LoadingState}.tsx
│   │   └── screens/{HomeScreen,ArtworkDetailScreen,LoginScreen,RegisterScreen,FavoritesScreen,SavedScreen,ProfileScreen,DesignDetailScreen,CapturePreviewScreen}.tsx
│   ├── features/
│   │   ├── ar/
│   │   │   ├── ARViewer.tsx
│   │   │   ├── ARScene.tsx
│   │   │   ├── Painting.tsx
│   │   │   ├── AROverlay.tsx
│   │   │   ├── useARPlacement.ts
│   │   │   ├── arTypes.ts
│   │   │   ├── arUtils.ts
│   │   │   ├── arAssetResolver.ts
│   │   │   └── arCapture.ts
│   │   ├── auth/{useAuth,authUseCases}.ts
│   │   ├── gallery/{useArtworks,artworkUseCases}.ts
│   │   ├── artwork/{useArtwork}.ts
│   │   ├── favorites/{useFavorites,favoriteUseCases}.ts
│   │   ├── designs/{useDesigns,designUseCases}.ts
│   │   └── profile/{useProfile,profileUseCases}.ts
│   ├── data/
│   │   ├── firebase/{FirebaseAuthRepository,FirebaseArtworkRepository,FirebaseFavoriteRepository,FirebaseSavedDesignRepository,FirebaseCaptureStorage}.ts
│   │   ├── local/{LocalSavedDesignRepository,LocalCaptureStorage}.ts
│   │   ├── mock/{mockArtworks,MockArtworkRepository}.ts
│   │   └── mappers/{artworkMapper,userMapper,designMapper}.ts
│   └── infra/firebase/{client,authPersistence}.ts
├── assets/
│   ├── artworks/                  # 12 artwork assets có quyền dùng
│   ├── ar-demo/                   # ảnh demo AR local chính chủ
│   ├── branding/
│   └── placeholders/
├── firebase/
│   ├── firestore.rules
│   ├── storage.rules
│   ├── firestore.indexes.json
│   └── tests/                    # rules tests (Firebase Emulator)
├── scripts/
│   ├── seed-artworks.*           # chỉ chạy trong trusted admin environment
│   └── check-env.*
├── tests/
│   ├── domain/
│   ├── features/
│   ├── data/
│   └── integration/
└── docs/
    ├── SETUP.md
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── AR_TEST_PLAN.md
    ├── SECURITY.md
    ├── PROGRESS.md
    ├── DECISIONS.md
    ├── NEEDS_USER_ACTION.md
    ├── NEXT_STEPS.md
    ├── RELEASE.md
    ├── TEST_REPORT.md
    └── FIVE_MEMBER_HANDOVER.md
```

**Lưu ý:** Tên thư mục minh họa, có thể điều chỉnh ít để phù hợp quy ước router/TS nếu cần, nhưng phải giữ rõ 5 module; mọi quyết định thay đổi kiến trúc ghi `docs/DECISIONS.md`. Không tạo thư mục literal có dấu `{}`: đó là ký hiệu viết ngắn cho các file liên quan.

### 6.1. UI/UX design tokens

- Brand: ArtSpace AR, concept gallery nghệ thuật tối giản, sắc nền sáng ấm (`#FAF8F5`), chữ tối (`#262626`), accent terracotta (`#BA654B`) hoặc một màu chủ đạo thống nhất; màu cuối cùng khai báo duy nhất tại theme.
- Font có hệ phân cấp Title/H1/H2/Body/Caption, kích thước 16sp hoặc hơn cho body quan trọng; text contrast tốt.
- Spacing scale 4/8/12/16/24/32; bo góc 12–20; touch target từ ~44–48dp; safe areas, bàn phím và Android back hợp lệ.
- Gallery grid 2 cột (điện thoại), card ảnh tỷ lệ chuẩn, skeleton khi load, search + category pills, badge Featured khi thực sự dữ liệu có.
- Artwork Detail CTA **View in AR** nổi bật; thể hiện dimensions `widthCm × heightCm` và cảnh báo AR cần điện thoại hỗ trợ.
- AR overlay tối giản: Scan help → Tap to Place → Resize/Reset/Change/Capture. Không chồng nhiều control che camera; scan indicator rõ ràng, tránh rung UI theo frame.
- Saved Designs hiển thị `Local on this device` hoặc `Cloud saved` theo mode, thông báo đúng khi chưa đăng nhập.

---

## 7. CODE STYLE / RULES CỤ THỂ CHO CODEX

**R-01 — Contract-first:** đọc master trước; xác nhận phạm vi, dependencies và existing repo trước khi edit.

**R-02 — One-agent ownership:** Codex được sửa tất cả file cần thiết, không bị giới hạn owner; mỗi thay đổi cross-module phải giữ contracts, tests và ghi lý do.

**R-03 — Không fake success:** chỉ báo PASS nếu chạy command thành công hoặc có xác nhận manual test; chưa có thiết bị → `UNVERIFIED_PHYSICAL_DEVICE`.

**R-04 — No silent downgrade:** không tùy tiện downgrade Expo/React Native/ViroReact, không `--force`/`--legacy-peer-deps` che lỗi nếu chưa có ADR.

**R-05 — Không Expo Go cho AR:** phải build native dev client; web/emulator chỉ test UI.

**R-06 — Async UI states:** network/camera/upload đều loading/success/empty/error + retry; timeout hợp lý.

**R-07 — Dữ liệu được typed:** TypeScript strict, dữ liệu từ Firebase map/validate tại M3.

**R-08 — Tách UI và dữ liệu:** UI/AR không import Firebase SDK; usecases chỉ gọi interfaces.

**R-09 — Security:** bảo vệ auth state, Rules; không lưu password, access token, secret vào Firestore, log hoặc repo.

**R-10 — Ảnh hợp pháp:** dùng ảnh do nhóm sở hữu/được cấp phép; không tự scrape ảnh bản quyền thiếu quyền.

**R-11 — Accessible UI:** touch target ≥ ~44–48 dp, text rõ, contrast, nhãn nút, lỗi có thông tin.

**R-12 — Clean Architecture pragmatism:** không over-engineer; repositories + hooks đủ, tránh state/cache library không có lý do.

**R-13 — Test:** module có pure logic phải có test, contract thay đổi phải cập nhật mocks.

**R-14 — Comments:** giải thích lý do kỹ thuật phức tạp (Viro anchor coords, cleanup), không comment hiển nhiên.

**R-15 — Imports:** aliases `@/src/...` theo tsconfig Expo, thống nhất barrel exports để giảm deep import tùy tiện.

**R-16 — Navigation:** định nghĩa route params/redirect; guest preview không chặn, login prompt cho save.

**R-17 — Storage:** rõ `cloud` vs `local`, cleanup file khi delete, không để tài liệu nói có sync nếu chỉ local.

**R-18 — Permissions:** chỉ xin quyền khi cần, permission denied có phương án điều hướng lại.

**R-19 — AR accuracy:** không claim đo kích thước chính xác tuyệt đối; thử vị trí trên tường textured đủ sáng.

**R-20 — Resource cleanup:** unsubscribe auth listeners, cancel pending async, không leak scene; AR state reset khi đóng.

**R-21 — Git:** không commit build artifacts, secret, `node_modules`, ảnh private, keystore, `.env.local`.

**R-22 — Khi API chưa chắc chắn:** tra official docs/TypeScript declarations của package installed, ghi spike và thực nghiệm; không bịa function/prop.

**R-23 — Không claim hoàn thành phase** nếu còn `TODO` tại các Must Have hoặc `npx tsc --noEmit` fail.

**R-24 — Báo cáo sau mỗi phase:** tóm tắt file chỉnh, lệnh chạy, kết quả PASS/FAIL/UNVERIFIED, limitation, next dependencies.

**R-25 — UI brand:** thống nhất màu nền off-white, charcoal, accent terracotta hoặc xanh trầm; thay đổi palette cần ghi một lần vào theme + DECISIONS; tối ưu chữ rõ, card spacing.

---

**R-26 — Dependency reproducibility:** khóa `package-lock.json`, dùng `npm ci` trong CI; không sử dụng `latest` tùy tiện sau khi freeze.

**R-27 — Actual implementations:** mock fixture chỉ dùng development/offline fallback rõ nhãn và tests; release không được đánh tráo fake Auth/AR/cloud thành thật.

**R-28 — Account/permission safety:** không tự động bật Firebase billing, không tự thay đổi quyền tài khoản hoặc upload dữ liệu cá nhân. Nếu service chưa cấu hình thì hiển thị setup state hữu ích.

**R-29 — No deceptive captures:** screenshot chỉ pass khi ảnh đọc được và thật sự chứa cảnh camera + đối tượng AR; `takeScreenshot` UI React Native overlay có thể không được capture.

**R-30 — Test evidence:** log lệnh + exit code; tách unit/integration/device/manual; `UNVERIFIED` không phải PASS.

---

## 8. AUTONOMOUS CODEX BUILD RUNBOOK — 13 PHASES (00 → 12)

### 8.0. Quy tắc dependency và reporting

**Một Codex thực hiện tất cả**, không chia branch cho từng người. Kết thúc mỗi phase ghi `docs/PROGRESS.md` dạng:

```md
### PHASE XX — [title]
- Status: PASS | PARTIAL | BLOCKED | UNVERIFIED
- Requirements addressed: FR-...
- Files created/changed: ...
- Commands actually run: command → PASS/FAIL + concise reason
- Manual device test: PASS/FAIL/UNVERIFIED + model + Android/ARCore version
- Firebase/Storage test: PASS/FAIL/UNVERIFIED + emulator or sandbox mode
- Known issues / blockers: ...
- Decision: next independent phase and remaining acceptance gate
```

**Gate AR:** PHASE 01 là kỹ thuật phải kiểm chứng sớm. Nếu không có thiết bị ngay, vẫn được xây các module độc lập ở phases 02–04 nhưng giữ `AR_DEVICE_UNVERIFIED` và không claim toàn app xong. Nếu AR build error thực sự thì ưu tiên sửa native trước khi phát triển sâu.

### PHASE 00 — Bootstrap repo, pin stack, configure tooling

**Input:** blank repo hoặc source hiện có. **Output:** expo app khởi động, toolchain reproducible.

- Kiểm tra git status, runtime Node/npm/Android SDK, existing code. Repo trống: scaffold **SDK 57 explicit** (ví dụ `npx create-expo-app@latest artspace-ar --template default@sdk-57`, sau khi kiểm chứng template tồn tại). Repo có source: không scaffold chồng, audit compatibility trước.
- Kiểm tra `npm view @reactvision/react-viro@3.0.3 peerDependencies`; `expo` SDK 57 ↔ RN 0.86; `npx expo install --check` hoặc tương đương theo SDK; Node >= phiên bản Expo yêu cầu (SDK 57 theo docs ≥22.13).
- Add ViroReact 3.0.3, Expo Dev Client, Expo Router nếu template chưa có, required Expo UI/media libraries, Firebase JS SDK >=12 phù hợp Expo SDK 57; avoid all unrelated dependencies.
- Expo config: app name `ArtSpace AR`, slug `artspace-ar`, Android package unique placeholder `com.artspacear.mma301` (cho phép cấu hình lại), plugin `@reactvision/react-viro`, permission camera đúng; không bật cloud anchor/geospatial provider không cần.
- `eas.json` có `development` + `preview` APK profiles, `cli.appVersionSource` hợp lệ; tạo scripts `typecheck`, `lint`, `test`, `doctor`. TypeScript strict.
- `.env.example`, `.gitignore`, `README.md`, `AGENTS.md` gọn, `docs/SETUP.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/NEEDS_USER_ACTION.md`.
- Commands: `npm install`/`npm ci`, `npx expo-doctor`, `npx tsc --noEmit`, lint. Cập nhật evidence.

**DoD:** dependency resolution sạch, Expo config parse được, static checks pass. Không claim native build nếu chưa chạy. **Codex: tự sang Phase 01.**

### PHASE 01 — Real AR technical spike: vertical-wall detection + placement

**Input:** project buildable. **Output:** màn hình AR tối thiểu đặt ảnh local lên tường.

- Kiểm tra ARCore-supported Android qua official devices list; chuẩn bị `docs/AR_TEST_PLAN.md` chứa model/API/OS/ánh sáng/tường.
- Build custom native **development client**, không Expo Go; attempt `npx expo run:android` hoặc EAS dev build nếu môi trường có quyền.
- `ViroARScene` dùng `anchorDetectionTypes={['PlanesVertical']}`. Với ViroReact 3.x, ref-forward `onAnchorFound`, `onAnchorUpdated`, `onAnchorRemoved` đến `ViroARPlaneSelector` (xem installed types/official docs trước khi code). `alignment='Vertical'`.
- Render một ảnh mẫu **chính chủ**, aspect 60×90cm, chọn tường bằng tap; xử lý hướng tranh và khoảng cách khỏi tường để tránh z-fighting, reset lại vị trí. Không cố gắn plane vào camera-facing overlay.
- Test permission denied, no supported AR mode, scene init error, scanning timeout/help, close/open session.
- **Spike screenshot:** tra API screenshot phiên installed; kiểm tra ảnh thật có camera + tranh. Nếu không, làm proof với capture API được hỗ trợ, ghi blocker rõ; không tự coi screenshot hoàn tất.
- Ghi evidence `docs/AR_TEST_REPORT.md` nếu có máy thật, hoặc checklist `UNVERIFIED_DEVICE` nếu không.

**DoD:** typecheck/lint pass + AR render proof; **AR physical PASS** cần test trên máy hỗ trợ, tap vertical wall, đi nghiêng vẫn bám; screenshot có bằng chứng hoặc trạng thái `BLOCKED_CAPTURE`. Nếu không có máy, không gian dối, tiếp tục phases không phụ thuộc máy.

### PHASE 02 — Freeze domain models, contracts, validators, fake fixtures

- Implement đầy đủ `Artwork`, `Category`, `UserProfile`, `Favorite`, `SavedDesign`, `Result<AppError>`, `SourceKind`, `StorageMode`, `FrameStyle`, `ARViewerProps` như Section 3.
- Tạo interfaces: `AuthRepository`, `ArtworkRepository`, `FavoriteRepository`, `SavedDesignRepository`, `CaptureStorage`; signatures/DTO tương thích với UI/AR; decouple Firebase.
- Validators cho email/password/displayName, artwork dimensions positive/finite, image URL/path, `scaleFactor` clamp [0.5,2.0], sanitize string, các field nullability.
- Fake catalogue có ≥12 tranh từ artwork assets tạo/được cấp quyền; cover 3+ categories; không dùng ảnh không có quyền.
- Unit tests validators, DTO mappers với missing/invalid fields, pure AR conversion, repository fake.
- Ghi contracts v1 và ADR. Không tự tạo method signature chỉ được dùng ở một nơi.

**DoD:** `src/domain/**` không import React/Firebase; fixture có đủ artwork cho gallery và AR; tests pass.

### PHASE 03 — Firebase clients, Firestore, Security Rules, local/cloud adapters

- Tạo Firebase JS SDK modular `src/infra/firebase/client.ts`, dùng `EXPO_PUBLIC_FIREBASE_*` public config; không commit real credentials hay service account. Khởi tạo Auth persistence theo chính **Firebase SDK version installed** + AsyncStorage; tránh double init trong Fast Refresh.
- Auth: email/password register/login/logout, observe auth, profile document created/updated; handle profile missing. Firestore `Timestamp` → ISO domain; email đi từ `auth.currentUser` là nguồn chính xác khi hiển thị.
- Catalogue: `categories`, `artworks`, `where(status == published)` cho list, hidden deny; 12 artwork demo có quyền dùng, script seed dùng môi trường admin tách khỏi mobile; nếu không có cloud credentials thì fallback local fixture cho browsing, UI thể hiện demo mode.
- Favorites per UID, idempotent add/remove; savedDesigns metadata per UID trong cloud mode; Cloud Storage `designs/{uid}/{designId}.jpg` nếu bucket thực sự active.
- Implement LocalSavedDesignRepository + LocalCaptureStorage dùng **persistent app files**, metadata local persisted (AsyncStorage/SQLite hợp phiên Expo). Mode local phải hoạt động không có billing và thể hiện "On this device", không nhét `file://` vào Firestore document rồi gọi đó là cloud.
- `FirebaseCaptureStorage`: upload image -> persist metadata, rollback file nếu Firestore ghi thất bại; delete recoverable; avoid exposed public download URLs for private design nếu không cần.
- Rules Firestore/Storage deny by default; reads published catalogue only, no mobile write catalogue; owner-only profile/favorites/designs; image MIME/size check; unit rule tests Firebase Emulator Suite nếu có Java/Firebase CLI.
- Error normalization: unavailable network, permission denied, missing doc, invalid credentials, storage not enabled; retry appropriate.

**DoD:** compile/test; mock or emulator full use cases; cloud tasks marked UNVERIFIED until connected; rules tests pass nếu emulator available.

### PHASE 04 — UI system + navigation + all screens

- Theme tokens từ Section 6; build reusable button/input/card/skeleton/loading/empty/error/dialog components, SafeArea/KeyboardAvoidingView.
- Routes: Home/Gallery, artwork detail, AR, auth register/login, Favorites, Saved, Profile, design detail/capture preview, not-found/error.
- Gallery 2-col/search/filter categories + featured; images placeholders/caching; Detail title/description/60×90 cm sizing, View in AR CTA.
- Auth flows validation, friendly errors; guest browse and AR allowed; Favorites/cloud-save prompt sign in with return URL/draft preserved.
- Saved design list thumbnail/status local/cloud, delete confirmation, missing-file error; Profile update displayName/logout.
- Accessibility labels, Android back, safe area, no hard-coded dummy success notifications. Visual states for every async call.

**DoD:** all routes open, navigation flows tested and render with fake repositories, no camera dependency for non-AR screens; screenshots recorded when possible.

### PHASE 05 — Production AR module + interactions

- Replace hard-coded POC with `ARArtworkInput` passed from Detail, load/copy remote art image to local cached URI in UI layer/asset resolver prior to scene. Graceful fallback local sample and retry on failure.
- Implement finite states: initializing → scanning → wall-found → placed → adjusting → capturing → captured; error/unsupported transitions; no auto-success.
- Place single painting on selected vertical plane with actual dimensions in meters; on scaling preserve original aspect; clamp factors 0.5–2.0; textured surface aligned to plane normal.
- Move/reposition: MUST offer Reset / Tap again; **drag within wall is SHOULD** if touch-coordinate transform can be verified and constrained to plane. Do not fake drag by translating image in screen-space.
- Switch painting image and dimensions in same AR session, validate texture loaded; reset state if incompatible. Optional frame: none/black/white after core passes.
- Overlay controls accessible, camera feed unobstructed, show actionable scanning hint. Avoid Firebase/firestore calls inside AR frame loop; dispose listeners/texture/session refs when leaving.
- Capture callback returns validated local image URI + placement snapshot; verify actual output on phone. Avoid claiming React Native overlay included if Viro screenshot only captures native scene.

**DoD:** automated math/tests pass, device manual test checklist updated; no regression from POC.

### PHASE 06 — Business workflows: Auth/Gallery/Favorites/Saved/Profile

- Implement use cases and hooks over repositories; stable loading/error/refresh; profile/auth state provider, protected actions vs public browsing.
- Auth: register, login, sign out, persist session, update profile; validate and avoid exposing credentials.
- Gallery: filter/search published content client side (for 12–50 works), feature artwork, preview local fixture on Firebase not configured.
- Favorites: toggle idempotent, unauthorized redirect, optimistic update rollback on failure, hide other users' favorites.
- Saved designs: capture draft preserved through login (memory/temp file), local/cloud mode selection from config, create/retrieve/delete, orphan cleanup and replay protection.
- Profile read/update displayName; optional avatar only if time permits.

**DoD:** feature/use-case tests pass; full flow works with fake repositories and when configured with Firebase emulator/sandbox.

### PHASE 07 — Dependency injection and end-to-end integration

- Configure providers and repository factory; centralized feature flags: `firebaseConfigured`, `cloudStorageEnabled`, `demoCatalogueEnabled`, `arSupported` (real detection; don't infer from device brand).
- Connect Gallery → Artwork Detail → AR → Capture Preview → Save → Saved Design Detail; Guest authentication transition keeps draft; Favorite/Profile flows.
- Ensure typed route params, missing artwork/error/empty states; cached images load into Viro; thumbnail vs full asset chosen appropriately.
- Native Android screen/permission config from Expo matches actual plugin; route back releases scene; AR unsupported does not break rest of app.
- Use emulator/sandbox where available. Do not prepopulate UI with hard-coded 'Success' unless operation returned success.

**DoD:** build compiles, E2E walkthrough documented; integration tests cover mock and auth states; blockers categorized.

### PHASE 08 — Screenshot/save reliability, cleanup, storage scenarios

- Verify screenshot file exists, decodes, includes camera background + rendered artwork; on failure display error and Retake/Retry.
- Copy temporary screenshot to persistent location in local mode; ensure safe filename and delete behavior. Cloud: upload image with owner UID and consistent doc ID/path.
- Handle missing permission to save phone gallery separately from private app storage; if user chooses to export gallery, request relevant permission only then.
- Failure matrix: no network, app interruption, Cloud Storage permission denied, upload success + Firestore failure, deletion partial failure, anonymous user redirected to login with draft, invalid `file://` URI after relaunch.
- Document retention and cleanup semantics; no embedded private photo in app analytics/logs.

**DoD:** local persistence survives restart; cloud works only if tested; capture true contents manually verified before marking saved design ready.

### PHASE 09 — Automated tests, emulator rules, static analysis

- Run `npm ci`, `npx expo-doctor`, `npx tsc --noEmit`, `npm run lint`, `npm test -- --runInBand` (adapt flags per runner) and fix all failures.
- Test domain/scale/validations, catalogue query filter, auth flows with fake repository, favorites account isolation, save/delete failure recovery.
- Firebase Emulator Rules tests: unauthorized read/write, A vs B, hidden artwork, mobile catalogue writes forbidden, MIME/size limit storage, profile validation.
- Smoke tests navigation/routing/accessibility/keyboard. Investigate image errors on different resolutions.
- Detect hard-coded secrets, unexpected tracked files, failing endpoints, placeholder TODOs for MUST features; remove unlicensed copyrighted assets.

**DoD:** documented commands/result, all available automated checks pass; report never states manually unverified AR as tested.

### PHASE 10 — Android hardware QA + performance

- On supported device test permission grant/deny, textured/white wall, varied lighting, place, tracking after side step, scale, reset, switch and capture.
- Test repeated AR open/close 10×; no native crashes; record device model, Android version, ARCore version, network state, screenshots and video.
- App performance: no obvious excessive state churn from plane update, loading UX okay; no unhandled rejection, no high-frequency Firebase writes.
- Test unsupported ARCore device graceful error; if physically unavailable mark unverified and provide manual script.

**DoD:** signed-off `docs/AR_TEST_REPORT.md` with real evidence or explicit unverified list. Need actual test for final acceptance.

### PHASE 11 — Release APK, docs, demo and final QA

- `eas build --platform android --profile preview` (or `npx eas-cli ...`) only if authorized Expo account available; preview uses APK, not AAB; download/install and test while Metro disabled.
- Confirm packaging, app icon/splash, no debug overlay; confirm env injection for Firebase, device permissions and camera availability.
- Finish `README.md`, `docs/SETUP.md`, `ARCHITECTURE.md`, `DATABASE.md`, `SECURITY.md`, `RELEASE.md`, `TEST_REPORT.md`, `NEEDS_USER_ACTION.md`, `PROGRESS.md`.
- Create demo script 3–5 minutes, screenshots UI/AR/video of actual app; no generated mock screenshots passed off as real tests.
- Final pass build errors, accepted FR/NFR, honest status list, APK file/link only if actually produced.

**DoD:** installable APK and smoke test PASS or accurately recorded environment blocker; no false release claim.

### PHASE 12 — Five-person source handover + documentation finalization

- Create `docs/FIVE_MEMBER_HANDOVER.md` with **five logical work packages** corresponding to Section 5; each package includes paths, technical explanations, public APIs, key test scenarios, known issues, modifications recommended, and demo talking points.
- Make architecture and data flow diagrams (Mermaid in docs), step-by-step per-module walkthrough, README references, setup instructions for new teammates.
- `docs/NEXT_STEPS.md` includes all unverified manual steps and stretch goals (upload custom images, change frame, share).
- Optional `CHANGELOG.md`, version `v1.0.0-mma301` or semver tag only when it accurately reflects status; do not sign off missing AR/device tests.

**DoD:** repo self-contained enough for five team members to understand and modify. Codex final answer reports achieved status by four gates (CODE_READY, AR_VERIFIED, CLOUD_VERIFIED, RELEASE_VERIFIED).

---

## 9. TEST PLAN & RELEASE ACCEPTANCE

### 9.1. Checklist quality chung cho mọi phase

- [ ] New source/logic thực sự tồn tại; không chỉ scaffold hoặc placeholder.
- [ ] `npx tsc --noEmit` pass.
- [ ] `npm run lint` pass.
- [ ] Automated tests liên quan pass; không báo test nếu script không chạy.
- [ ] Module contracts/DTO/routes không bị sai kiểu.
- [ ] Auth, profile, private Storage/Firestore không lộ dữ liệu.
- [ ] Không có secret/keystore/service account trong Git.
- [ ] Loading/empty/error/retry phù hợp, màn hình không trắng khi Firebase/AR unavailable.
- [ ] Image assets có quyền sử dụng; fallback rõ ràng.
- [ ] Physical AR, capture, cloud and APK gates thực hiện hoặc `UNVERIFIED` được báo rõ.

### 9.2. Test cases nghiệm thu (MUST)

| ID | Type | Steps | Expected |
|---|---|---|---|
| TC-01 | Auth | Register valid email/password | Account + user profile created |
| TC-02 | Auth | Register invalid email/weak password | Helpful error, no broken UI |
| TC-03 | Auth | Login, restart app | Logged-in state persists |
| TC-04 | Auth | Logout, reopen private screen | Redirect/login required |
| TC-05 | Gallery | 12 artwork seed | Gallery renders with image placeholders |
| TC-06 | Gallery | Search exact & unmatched term | Correct results/empty state |
| TC-07 | Gallery | Filter categories | Only appropriate artworks |
| TC-08 | Detail | Open artwork | Valid metadata + CTA |
| TC-09 | AR | Deny camera | Explain permissions + Back/Settings |
| TC-10 | AR | Unsupported device | Friendly unsupported state; Gallery still works |
| TC-11 | AR | Scan textured vertical wall | Vertical plane detected |
| TC-12 | AR | Tap wall | Painting attaches, appropriate orientation |
| TC-13 | AR | Move phone side-to-side | Painting remains approximately wall-locked |
| TC-14 | AR | Scale 0.5×, 2× | Aspect ratio preserved; clamp enforced |
| TC-15 | AR | Reset placement | Can select new wall position |
| TC-16 | AR | Switch artwork | Correct image and physical dimensions |
| TC-17 | AR | Capture | Actual output includes camera + artwork |
| TC-18 | AR | Close/reopen AR 10× | No repeat crash/session leak |
| TC-19 | Save | Guest presses cloud save | Login requested; draft preserved |
| TC-20 | Save | User save cloud mode | Storage file + Firestore doc consistent |
| TC-21 | Save | User save local-only mode | Persisted local file + local metadata; UI labels local |
| TC-22 | Save | Reopen app | Saved design displayed correctly |
| TC-23 | Save | Delete design | Remove image/metadata or recoverable retry |
| TC-24 | Favorites | Toggle favorite | Persists for user only |
| TC-25 | Security | UID A reads/writes UID B paths | Firebase denies |
| TC-26 | Security | Mobile tries write artwork | Firebase denies |
| TC-27 | Security | Upload wrong MIME/oversized | Storage denies |
| TC-28 | Offline | Disconnect during save | Error/retry; no false success |
| TC-29 | Release | Install preview APK, Metro off | App starts, core screens work |
| TC-30 | Performance | Browse→AR→Capture repeatedly | No obvious leak/consistent usability |

### 9.3. Phân loại evidence và tiêu chuẩn không giả tạo

| Nhóm | Tool/evidence | Kết luận cho phép |
|---|---|---|
| TS/lint | Terminal logs + exit code | `STATIC_PASS` |
| Unit tests | Test runner | `UNIT_PASS` |
| Rules | Firebase Emulator Suite hoặc project test (ghi rõ) | `RULES_PASS` |
| Real AR | Android hỗ trợ ARCore, video/log/ảnh, model OS | `AR_DEVICE_PASS` |
| Screenshot | File thực tế từ app, camera + tranh | `CAPTURE_PASS` |
| Cloud | Auth/Firestore/Storage thật, owner rules | `CLOUD_PASS` |
| APK | File build + cài launch khi không có Metro | `APK_PASS` |
| Not run | Không có nguồn xác minh | `UNVERIFIED`, không dùng PASS |

### 9.4. Demo script 3–5 phút

1. Home: vấn đề chọn tranh, xem 12+ artwork, search/filter.
2. Artwork Detail: kích thước, nút View in AR.
3. AR thật: scan tường, tap place, nghiêng điện thoại, resize, reset/đổi tranh.
4. Capture → preview → local/cloud Save → Saved Designs → mở/xóa.
5. Login/Favorite/Profile và trình bày Rules Firebase.
6. Kiến trúc năm module, hạn chế kỹ thuật (không lưu anchor xuyên phiên, local storage mode nếu billing không có).

Video demo phải ghi từ app chạy thật; video không thay thế test APK.

---

## 10. BUILD COMMANDS & CONFIG TEMPLATES

> Codex cần kiểm tra chi tiết dependency, plugin và SDK của repo thật trước khi chạy. Đây là baseline, không là bảo chứng mọi môi trường đều tương thích.

```bash
# after scaffolding an Expo 57 compatible project
npm ci
npx expo-doctor
npx tsc --noEmit
npm run lint

# native development build (requires Android toolchain)
npx expo prebuild
npx expo run:android
npx expo start --dev-client

# EAS (when Expo account/project is configured)
npx eas-cli build --platform android --profile development
npx eas-cli build --platform android --profile preview
```

**`eas.json` baseline:**

```json
{
  "cli": { "appVersionSource": "remote" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } }
  }
}
```

**`app.config.ts` concept:** đăng ký plugin `@reactvision/react-viro` và Android XRMode `AR`, không tự thêm các API key cho cloud anchors vì MVP không dùng; camera permissions do plugin/setup đảm trách. Codex cần đối chiếu config plugin schema installed; nếu bản code starter khác thì sửa dựa trên docs installed.

**`.env.example`:**

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_ENABLE_CLOUD_STORAGE=false
```

**Không lưu Firebase Admin credentials ở `.env` của client**. Seed script dùng `GOOGLE_APPLICATION_CREDENTIALS` local/gitignored hoặc môi trường có quyền thích hợp; không phân phối key cho toàn nhóm.

---

## 11. CODEX COMMAND TO EXECUTE ALL PHASES (COPY AS FIRST USER PROMPT)

```text
You are the sole owner of implementation for ArtSpace AR. Read ARTSPACE_AR_CODEX_FULL_BUILD.md IN FULL before editing files. Build the COMPLETE Android-first React Native/Expo + ViroReact/ARCore + Firebase app from repo bootstrap through deployment-ready APK according to PHASE 00 through PHASE 12.

Do not divide the development process between five people: you may modify the whole repository. The five modules exist for source organization and later handoff only. Keep strict TypeScript, clean interfaces, properly secured Firebase repositories and a true AR experience using ViroReact (not a 2D camera overlay).

Proceed sequentially, continue autonomously while the environment allows, and after each phase append real files changed, commands run with actual results, and blocker status to docs/PROGRESS.md. When device access, Firebase credentials, billing authorization, an Expo login, or manual AR validation is unavailable, document exact instructions in docs/NEEDS_USER_ACTION.md; never invent a successful test or secretly enable payment. Keep implementing independent parts with transparent adapters. Verify SDK/peer deps before installing, do not use Expo Go for AR, do not skip validation gates or silently replace mandatory features with fake success.

At the end, produce app code, sample assets, Firebase rules & seed scripts, tests, setup docs, EAS preview config, test report, and docs/FIVE_MEMBER_HANDOVER.md. Give a truthful status matrix for CODE_READY, AR_VERIFIED, CLOUD_VERIFIED, RELEASE_VERIFIED.

START NOW with PHASE 00, then continue through the later phases without asking me which developer is responsible.
```

### Khi Codex bị ngắt context / session

```text
Resume ArtSpace AR from the repository, not memory. Read ARTSPACE_AR_CODEX_FULL_BUILD.md, docs/PROGRESS.md, docs/DECISIONS.md, docs/NEEDS_USER_ACTION.md and git status. Determine the earliest unfinished prerequisite, verify real code and logs, implement the next phase, execute available checks, document results, then continue while possible. Never mark untested device/build/cloud operations as PASS.
```

### Mẫu final report mà Codex PHẢI in ra

```text
ARTSPACE AR FINAL IMPLEMENTATION REPORT
- Implemented phases: ...
- Completed FRs: ... / Deferred FRs: ...
- CODE_READY: PASS/FAIL with evidence
- AR_VERIFIED: PASS/FAIL/UNVERIFIED + device model/evidence
- CLOUD_VERIFIED: PASS/FAIL/UNVERIFIED + local/cloud mode
- RELEASE_VERIFIED: PASS/FAIL/UNVERIFIED + APK path/artifact if exists
- Changes: ...
- Test commands executed (no invented outputs): ...
- Required user actions: ...
- Security/Risks/Limitations: ...
- How to run development build and install APK: ...
- Files mapping M1 to M5: docs/FIVE_MEMBER_HANDOVER.md
```

---

## 12. RISK REGISTER & FALLBACK POLICY

| Risk | Impact | Mitigation / Fallback |
|---|---|---|
| Expo SDK mismatch | Build fails | Lock SDK 57, peer check; Codex fixes & pins config |
| Viro API changed | AR implementation breaks | Read installed types/new plane-selector docs; no old snippets |
| No ARCore phone | Cannot validate core | Borrow an explicitly supported Android phone early; no unsupported demo claim |
| Smooth/white wall | Weak plane tracking | Better light/textured wall, user guidance, documented limitation |
| Remote image URI fails | Artwork invisible | Cache to local file, test ViroImage, use local demo asset |
| Screenshot missing camera | Save unusable | Verify actual output early; research supported capture method, block feature until verified |
| Firebase Storage billing unavailable | Cannot cloud-save photos | LocalSavedDesignRepository + clear local-only UI; no fake sync |
| Cloud upload succeeds, DB fails | Orphan file | Compensating delete/retry + error state |
| Concurrent contract changes | Integration conflicts | Contract freeze+ADR+versioned migrations |
| Offline network | Gallery/profile fails | Loading/error/retry, optional catalogue cache |
| Secret leakage | Account/data risk | gitignore, no Admin SDK client, Security Rules tests |
| Time too short | Scope incomplete | Keep MUST: 1 painting AR, gallery, auth, favorite, capture & local save; defer custom artwork/frames |

**Go/No-Go:** Nếu PHASE 01 chưa có ảnh/video chứng minh AR trên thiết bị hỗ trợ, coi core feature là **chưa xác minh**. Nếu `takeScreenshot()` không có output hợp lệ thì Saved Design chưa thể gọi là hoàn chỉnh. Khắc phục trước khi đầu tư nhiều vào tính năng phụ.

---

## 13. SUBMISSION PACKAGE CHO MMA301

Tối thiểu:

- [ ] Git repository có commit history, module handover + commit history và đóng góp thực tế (nếu môn yêu cầu).
- [ ] Android preview APK cài độc lập.
- [ ] Video demo AR thật + screenshots các màn hình.
- [ ] `README.md` hướng dẫn cài/dev/build + môi trường.
- [ ] Use Case Diagram & Specifications, system architecture, data model.
- [ ] Firebase Rules, sample catalogue data và test reports.
- [ ] Test Case matrix có kết quả thật, AR device model/Android version/lighting.
- [ ] Phân chia 5 module theo source và ghi nhận phần đóng góp thực tế.
- [ ] Known limitations minh bạch: không persistent anchor, 1 tranh mỗi lần, storage local nếu không bật billing.

---

## 14. VERIFIED TECH REFERENCES & LIMITS (27/10/2026)

Các tài liệu dưới đây là nguồn xác minh ban đầu; Codex phải kiểm tra **package installed**, `peerDependencies` và API types vì nguồn tài liệu có thể thay đổi:

1. `@reactvision/react-viro` npm (v3.0.3 vào 27/10/2026): https://www.npmjs.com/package/@reactvision/react-viro
2. ViroReact changelog, v3.0.3 và ViroARPlaneSelector ref-based event forwarding: https://github.com/ReactVision/viro/blob/main/CHANGELOG.md
3. ViroReact & Expo: https://viro-community.readme.io/docs/integrating-with-expo — **không chạy ViroReact trên Expo Go**.
4. Viro Scene APIs: https://viro-community.readme.io/docs/viroarplaneselector và https://viro-community.readme.io/docs/viroarscenenavigator
5. Expo SDK 57 + React Native 0.86: https://expo.dev/changelog/sdk-57 và https://docs.expo.dev/versions/latest/
6. Tạo dự án, dùng `--template default@sdk-57` thay vì bị nhảy SDK mới hơn: https://docs.expo.dev/more/create-expo/
7. Firebase JS SDK trong Expo: https://docs.expo.dev/guides/using-firebase/ ; Firebase JS SDK >= 12 theo docs mới.
8. Firebase Auth persistence Expo: https://github.com/expo/fyi/blob/main/firebase-js-auth-setup.md
9. Cloud Storage Firebase billing: https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024 — phải là Blaze để dùng Cloud Storage sau 03/02/2026.
10. Firestore Rules: https://firebase.google.com/docs/firestore/security/rules-query và https://firebase.google.com/docs/rules/unit-tests
11. Storage Rules: https://firebase.google.com/docs/storage/security
12. Expo EAS APK: https://docs.expo.dev/build-reference/apk/
13. Supported ARCore devices: https://developers.google.com/ar/devices

**Version policy:** Expo SDK 57 + ViroReact 3.0.3 là baseline nghiên cứu, không phải tuyên bố bảo đảm chạy trên mọi thiết bị. Nếu khi code peer dependencies mâu thuẫn, dùng versions tương thích thực tế đã kiểm chứng, ghi ADR rõ lý do, không nâng đại lên SDK 58. Hỏi người vận hành chỉ khi buộc cần lựa chọn dẫn đến mất cốt lõi AR hoặc yêu cầu tài khoản/thanh toán.

---

## 15. FINAL DELIVERY CHECKLIST

- [ ] `README.md` khởi động từ zero đến dev client, demo mode và Firebase thật.
- [ ] `npm ci`, `npx expo-doctor`, typecheck, lint, tests có logs; không fake.
- [ ] TypeScript strict, 5 logical modules, unified repository, no cross-module circular imports.
- [ ] 12+ licensed artworks, working gallery/detail/search/filter, valid seed scripts.
- [ ] Firebase Auth, Firestore Favorites/Profiles, security rules; cloud-mode only when configured.
- [ ] Gallery/Detail → AR scene với 1 tranh chính xác tỷ lệ, real vertical wall detection.
- [ ] Permission, unsupported ARCore, scan help, place/scale/reposition/switch.
- [ ] Screenshot cảnh AR thật và lưu local/cloud có cleanup/error handling.
- [ ] SavedDesign list/detail/delete, Profile, Favorites, guest + login redirection.
- [ ] UI coherent, loading/error/empty states, Android back, accessible touch targets.
- [ ] Privacy/security tests, no credentials/secret in repository.
- [ ] EAS preview APK nếu build credentials có sẵn; bằng chứng cài máy thật nếu đã test.
- [ ] `docs/PROGRESS.md`, `docs/AR_TEST_REPORT.md`, `docs/TEST_REPORT.md`, `docs/RELEASE.md` chứa trạng thái thật.
- [ ] `docs/NEEDS_USER_ACTION.md` ghi mọi việc cần người vận hành, không giấu blocker.
- [ ] `docs/FIVE_MEMBER_HANDOVER.md` chỉ rõ phạm vi bàn giao 5 người sau khi code xong.

**END — ONE AGENT / ONE APP / 13 PHASES / 5 HANDOVER MODULES.**
