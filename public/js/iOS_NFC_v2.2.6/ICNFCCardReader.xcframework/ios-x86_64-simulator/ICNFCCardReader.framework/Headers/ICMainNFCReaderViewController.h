//
//  ICMainNFCReaderViewController.h
//  ICNFCCardReader
//
//  Created by Minh Minh iOS on 02/07/2021.
//  Copyright © 2021 Innovation Center - VNPT IT. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ICMainNFCReaderProtocols.h"
#import "ICMainNFCReaderPresenter.h"
#import "ICNFCBaseViewController.h"

NS_ASSUME_NONNULL_BEGIN


@protocol ICMainNFCReaderDelegate <NSObject>

@optional
/**
 * Phương thức được gọi khi người dùng chủ động THOÁT SDK
 * Tham số 'lastStep' xác định người dùng đóng SDK tại bước nào
 * ICNFCHelpQRCode  - tại bước Hướng dẫn quét mã QR
 * ICNFCScanQRCode  - tại bước Quét mã QR
 * ICNFCHelpMRZCode - tại bước Hướng dẫn quét mã MRZ
 * ICNFCScanMRZCode - tại bước Quét mã MRZ
 * ICNFCReaderNFC   - tại bước Đọc thông tin NFC
 * ICNFCMissingInputs  - tại popup Thiếu đầu vào
 * ICNFCNoSupportNFC - tại popup Không hỗ trợ NFC
 * ICNFCNoMoreRetryNFC -  tại popup  Hết lần thử lại
 * ICNFCPermissionCamera  - tại popup xin quyền camera
 */
- (void) icNFCMainDismissed:(ICNFCLastStep)lastStep;

/**
 * Phương thức được gọi khi thực hiện đọc thông tin NFC
 * Thường được sử dụng khi đọc NFC không dùng giao diện SDK.
 *
 * Tham số 'state' xác định các trạng thái đọc thông tin thẻ căn cước công dân
 * ICNFCStarted - xác định Trạng thái bắt đầu lắng nghe
 * ICNFCDidDetect - xác định Trạng thái xác định được tín hiệu đọc thẻ căn cước
 * ICNFCReading - xác định Trạng thái đang đọc thẻ căn cước
 * ICNFCDidError - xác định Trạng thái đọc thẻ căn cước bị lỗi
 * ICNFCCompleted - xác định Trạng thái hoàn thành đọc thẻ căn cước
 *
 * Tham số 'progress' được dùng ở trạng thái ICNFCReading. Tham số này thể hiện tiến độ đọc thông tin thẻ
 *
 * Tham số 'error' được dùng ở trạng thái ICNFCDidError. Tham số này thể hiện nguyên nhân gây ra lỗi khi đọc thông tin thẻ
 * ResponseError - Đã xảy ra sự cố khi đọc thẻ
 * Timeout - Hết thời gian phiên đọc thẻ còn hiệu lực
 * NFCNotSupported - Thiết bị không hỗ trợ NFC, hoặc không có NFC
 * TagNotValid - Thẻ không hợp lệ
 * ConnectionError - Lỗi kết nối
 * UserCanceled - Khi người dùng bấm nút Huỷ ở màn hình đọc thông tin căn cước
 * InvalidMRZKey - Khóa MRZ không hợp lệ cho thẻ này. Xảy ra khi Số căn cước, ngày sinh hoặc ngày hết hạn truyền vào không hợp lệ hoặc không đúng với thẻ
 * MoreThanOneTagFound - Nhiều hơn 01 thẻ được tìm thấy khi thực hiện đọc thông tin căn cước
 * NoResponse - Không có phản hồi thông tin từ thẻ. Xảy ra khi người dùng đang đọc thẻ, nhưng vì lý do nào đó, khiến tiến trình đọc thẻ không được tiếp tục cho đến lúc hết phiên đọc thông tin thẻ căn cước.
 * NFCError - Các lỗi chung khi thực hiện đọc thông tin thẻ căn cước. Xảy ra khi thẻ không đúng định dạng, hoặc không phải thẻ chip trên căn cước
 */
- (void) icNFCCardReader:(ICNFCReaderState)state progress:(NSInteger)progress error:(NSString *)error;

/**
 * Phương thức được gọi khi Bottom Sheet đọc NFC đã tắt
 */
- (void) icNFCPopupReaderChipDisappear;

@required
/**
 * Phương thức được gọi sau khi SDK hoàn thành
 * → Đóng SDK và trả dữ liệu cho người dùng
 * Dữ liệu sẽ lấy tại các thuộc tính của [ICNFCSaveData]. Tham khảo tại mục Dữ liệu trả về của tài liệu hướng dẫn tích hợp.
 * Ví dụ:
 * ICNFCSaveData.shared().dataNFCResult  - thông tin cá nhân đọc được từ thẻ căn cước như: Họ tên, ngày sinh, giới tính, quê quán,...
 * ICNFCSaveData.shared().dataGroupsResult - Dữ liệu đọc được từ thẻ căn cước như: SOD, COM, các DataGroup,...
 */
- (void) icNFCCardReaderGetResult;

@end


API_AVAILABLE(ios(13.0))
@interface ICMainNFCReaderViewController : ICNFCBaseViewController<ICMainNFCReaderViewProtocol>

@property (nonatomic) ICMainNFCReaderPresenter *presenter;

@property (weak, nonatomic) id<ICMainNFCReaderDelegate> icMainNFCDelegate;


#pragma mark - CÁC THUỘC TÍNH CƠ BẢN

// Giá trị này xác định ngôn ngữ được sử dụng trong SDK. Mặc định là icnfc_vi
// - icnfc_vi: Tiếng Việt
// - icnfc_en: Tiếng Anh
@property (nonatomic) NSString *languageSdk;

// Giá trị này xác định việc có hiển thị màn hình trợ giúp hay không. Mặc định là false (Không hiện)
@property (nonatomic) BOOL isShowTutorial;

// Giá trị bật hoặt tắt chức năng hướng dẫn, mặc định là false
@property (nonatomic) BOOL isDisableTutorial;

// Bật chức năng hiển thị nút bấm "Bỏ qua hướng dẫn" tại các màn hình hướng dẫn bằng video. Mặc định false (Không hiện)
@property (nonatomic) BOOL isEnableGotIt;

// Giá trị xác định luồng thực hiện đọc thông tin thẻ căn cước
// - QRCode: Hiển thị giao diện quét mã QR sau đó thực hiện đọc thông tin bằng NFC
// - MRZCode: Hiển thị giao diện quét mã MRZ sau đó thực hiện đọc thông tin bằng NFC
// - NFCReader: Hiển thị giao diện đọc thông tin bằng NFC. Dữ liệu truyền vào là: số ID, ngày sinh, ngày hết hạn
// - NFCOutside: Đọc thông tin bằng NFC ngay tại app (không mở giao diện). Dữ liệu truyền vào là: số ID, ngày sinh, ngày hết hạn
@property (nonatomic) ReaderCardMode readerCardMode;

// Số giấy tờ căn cước, là dãy số gồm 12 ký tự. Mặc định ""
@property (nonatomic) NSString *idNumberCard;

// Ngày sinh của người dùng được in trên Căn cước, có định dạng YYMMDD (ví dụ 18 tháng 5 năm 1978 thì giá trị là 780518). Mặc định ""
@property (nonatomic) NSString *birthdayCard;

// Ngày hết hạn của Căn cước, có định dạng YYMMDD (ví dụ 18 tháng 5 năm 2047 thì giá trị là 470518). Mặc định ""
@property (nonatomic) NSString *expiredDateCard;

// Bật chức năng tải ảnh chân dung trong CCCD. Mặc định false (Không tải ảnh lên)
@property (nonatomic) BOOL isEnableUploadImage;

// Bật tính năng Matching Postcode. Mặc định false (Không thực hiện)
@property (nonatomic) BOOL isEnablePostcodeMatching;

// Giá trị này được truyền vào để xác định nhiều luồng giao dịch trong một phiên. Mặc định ""
@property (nonatomic) NSString *inputClientSession;

// Giá trị này dùng để đảm bảo mỗi yêu cầu (request) từ phía khách hàng sẽ không bị thay đổi. ✓
// Sau mỗi request, dữ liệu trả về sẽ bao gồm giá trị challengeCode. Mặc định là "11111"
@property (nonatomic) NSString *challengeCode;

// Giá trị này được truyền vào để xác định các thông tin cần để đọc. Các phần tử truyền vào là các giá trị của CardReaderValues.
// Trường hợp KHÔNG truyền readingTagsNFC => sẽ thực hiện đọc hết tất cả
// Trường hợp CÓ truyền giá trị cho readingTagsNFC => sẽ đọc các thông tin truyền vào và mã DG13
@property (nonatomic) NSArray<id> *readingTagsNFC;

// Giá trị xác định bật tính năng xác thực thẻ có bị Sao chép hoặc chỉnh sửa hay không (ngay tại SDK). Mặc định false (Không thực hiện)
@property (nonatomic) BOOL isEnableCheckChipClone;

// Giá trị xác định bật tính năng xác thực thẻ có bị Sao chép hoặc chỉnh sửa hay không (ngay tại SDK). Mặc định false (Không thực hiện)
@property (nonatomic) BOOL isEnableWaterMark;

// Giá trị xác định bật tính năng thêm thông tin phục vụ IDCheck vào trong body request của api upload nfc. Mặc định false (Không thực hiện)
@property (nonatomic) BOOL isEnableAddIdCheckData;

// Giá trị xác định bật tính năng upload dữ liệu datagroups. Mặc định false (Không thực hiện)
@property (nonatomic) BOOL isEnableUploadDG;

// Giá trị này được truyền vào để xác định nội dung hiển thị khi mở hộp thoại đọc thông tin thẻ. Mặc định ""
@property (nonatomic) NSString *textReadyNFC;

// Giá trị này được truyền vào để xác định nội dung hiển thị khi đang đọc thông tin thẻ. Mặc định ""
@property (nonatomic) NSString *textScanningNFC;

// Giá trị này được truyền vào để xác định nội dung hiển thị khi đọc thông tin thẻ thành công. Mặc định ""
@property (nonatomic) NSString *textFinishNFC;

// Giá trị này được truyền vào để xác định nội dung hiển thị khi phát hiện và xác thực được thẻ. Mặc định ""
@property (nonatomic) NSString *textDetectedNFC;

// Tên VIDEO hướng dẫn quét NFC. Mặc định "" (sử dụng VIDEO mặc định khi truyền giá trị rỗng hoặc không truyền)
@property (nonatomic) NSString *nameVideoHelpNFC;

// Public Key cho việc mã hoá thông tin
@property (nonatomic) NSString *publicKey;

// Giá trị xác định bật tính năng mã hoá thông tin
@property (nonatomic) BOOL isEnableEncrypt;

// Giá trị xác định bật luồng
@property (nonatomic) ICNFCModeUploadFile modeUploadFile;

// Giá trị xác định luồng chức năng thực hiện NFC.
// Mặc định là ICNFCNTB
// - ICNFCNTB - thực hiện luồng đăng ký mới
// - ICNFCETB - thực hiện luồng cập nhật bổ sung thông tin
// - ICNFCVERIFY - thực hiện luồng xác thực
@property (nonatomic) ICNFCFlow flowNFC;

// Giá trị xác định số lần thử lại khi đọc NFC lỗi. Mặc định là 3
@property (nonatomic) NSNumber *numberTimesRetryScanNFC;


#pragma mark - BẢO MẬT - QUYỀN TRUY CẬP
// Các thuộc tính bảo mật dùng để kết nối đến dịch vụ eKYC
// Có thể lấy thông tin tại địa chỉ https://ekyc.vnpt.vn/admin-dashboard/console/project-manager

// Mã bảo mật khi thực hiện sử dụng dịch vụ NFC, có định dạng "Bearer + (Access token)". Mặc định là "" ✓
@property (nonatomic) NSString *accessToken;
// Mã bảo mật khi thực hiện sử dụng dịch vụ NFC. Mặc định là "" ✓
@property (nonatomic) NSString *tokenId;
// Mã bảo mật khi thực hiện sử dụng dịch vụ NFC. Mặc định là "" ✓
@property (nonatomic) NSString *tokenKey;

// Mã bảo mật khi thực hiện sử dụng dịch vụ NFC, có định dạng "Bearer + (Access token)". Mặc định là "" ✓
@property (nonatomic) NSString *accessTokenEKYC;
// Mã định danh luồng giao dịch khi thực hiện sử dụng dịch vụ eKYC VNPT. Mặc định là "" ✓
@property (nonatomic) NSString *tokenIdEKYC;
// Mã bảo mật khi thực hiện sử dụng dịch vụ eKYC. Mặc định là "" ✓
@property (nonatomic) NSString *tokenKeyEKYC;


#pragma mark - MÔI TRƯỜNG PHÁT TRIỂN - URL

// Giá trị tên miền chính của SDK. Mặc định "" (sẽ sử dụng môi trường PRODUCT)
@property (nonatomic) NSString *baseUrl;

// Đường dẫn đầy đủ thực hiện tải ảnh chân dung lên phía máy chủ để nhận mã ảnh. Mặc định "" (sẽ sử dụng môi trường PRODUCT)
@property (nonatomic) NSString *urlUploadImage;

// Đường dẫn đầy đủ thực hiện tải thông tin dữ liệu đọc được lên máy chủ. Mặc định "" (sẽ sử dụng môi trường PRODUCT)
@property (nonatomic) NSString *urlUploadDataNFC;

// Đường dẫn đầy đủ thực hiện tải thông tin log NFC lên máy chủ. Mặc định "" (sẽ sử dụng môi trường PRODUCT)
@property (nonatomic) NSString *urlUploadLogSDK;

// Đường dẫn đầy đủ thực hiện kiểm tra mã bưu chính của thông tin giấy tờ như Quê quán, Nơi thường trú. Mặc định "" (sẽ sử dụng môi trường PRODUCT)
@property (nonatomic) NSString *urlPostcodeMatching;

// Thông tin KEY:VALUE truyền vào Header. Mặc định [] ✓
@property (nonatomic) NSMutableDictionary *headersRequest;

// Thông tin id ưu tiên
@property (nonatomic) NSString *transactionId;

// Thông tin partner id ưu tiên
@property (nonatomic) NSString *transactionPartnerId;

// Thông tin partner id upload nfc
@property (nonatomic) NSString *transactionPartnerIDUploadNFC;

// Thông tin partner id postcode recent location
@property (nonatomic) NSString *transactionPartnerIDRecentLocation;

// Thông tin partner id postcode original location
@property (nonatomic) NSString *transactionPartnerIDOriginalLocation;

// Thông tin tên của chứng chỉ SSL
@property (nonatomic) NSString *nameSSLPinning;


#pragma mark - MÀU SẮC GIAO DIỆN

// 1. Thanh header: PA 1 nút đóng bên trái (LeftButton). PA 2 nút đóng bên phải (RightButton). mặc định là PA 1 (LeftButton)
@property (nonatomic) ModeButtonHeaderBar modeButtonHeaderBar;

// 2. Màu nội dung thanh header (Màu chữ và màu nút đóng). mặc định là FFFFFF
@property (nonatomic) UIColor *contentColorHeaderBar;

// 3. màu nền Thanh header. mặc định là trong suốt
@property (nonatomic) UIColor *backgroundColorHeaderBar;

// 4. Màu văn bản chính, Tiêu đề & Văn bản phụ (màu text ở màn Hướng dẫn, ở các màn Quét MRZ, QR, NFC). mặc định là FFFFFF
@property (nonatomic) UIColor *textColorContentMain;

// 5. Màu nền (bao gồm màu nền Hướng dẫn, màu nền lúc quét NFC). mặc định 122F41
@property (nonatomic) UIColor *backgroundColorMainScreen;

// 6. Đường line trên hướng dẫn chụp GTTT, bao gồm cả các popup cảnh báo. mặc định E8E8E8
@property (nonatomic) UIColor *backgroundColorLine;

// 7. Màu nút bấm (bao gồm nút Tôi đã hiểu, Hướng dẫn, Quét lại (riêng iOS)). mặc định là FFFFFF
@property (nonatomic) UIColor *backgroundColorButton;

// 8. Màu text của nút bấm (bao gồm nút Tôi đã hiểu, Quét lại (riêng iOS)). mặc định 142730
@property (nonatomic) UIColor *textColorTitleButton;

// 9. Màu nền chụp (màu nền quét QR, MRZ). mặc định 142730
@property (nonatomic) UIColor *backgroundColorCapture;

// 12. Màu nội dung tiêu đề của các màn hình Quét mã QR, Quét mã MRZ. mặc định là 18D696 (xanh)
@property (nonatomic) UIColor *textColorTitleMain;

// 12. Màu nội dung tiêu đề Xảy ra lỗi của các màn hình Đọc thông tin NFC. mặc định là CA2A2A (đỏ)
@property (nonatomic) UIColor *textColorTitleError;

// 12. Màu nền cho popup. Mặc định FFFFFF
@property (nonatomic) UIColor *backgroundColorPopup;

// 13. Màu văn bản trên popup. Mặc định 142730
@property (nonatomic) UIColor *textColorContentPopup;


// Hiển thị ảnh thương hiệu ở góc dưới màn hình. Mặc định false
@property (nonatomic) BOOL isShowLogo;

// Ảnh thương hiệu hiển thị cuối màn hình. Mặc định là ảnh thương hiệu VNPT
@property (nonatomic) UIImage *logo;

// Chiều rộng của ảnh thương hiệu, tối thiếu là 0, tối đa bằng bề rộng màn hình
@property (nonatomic) CGFloat withLogo;

// Chiều cao của ảnh thương hiệu, tối thiếu là 0, tối đa bằng chiều cao màn hình
@property (nonatomic) CGFloat heightLogo;


#pragma mark - CUSTOM VIEW
// màn hình tuỳ chỉnh cho màn hướng dẫn quét QR
@property (nonatomic, nullable) UIView *viewTutorialScanQRCode;

// màn hình tuỳ chỉnh cho màn quét QR
@property (nonatomic, nullable) UIView *viewScanQRCode;

// vùng tuỳ chỉnh cho phép quét QR
@property (nonatomic) CGRect frameViewScanQRCode;

// màn hình tuỳ chỉnh cho màn hướng dẫn quét MRZ
@property (nonatomic, nullable) UIView *viewTutorialScanMRZCode;

// màn hình tuỳ chỉnh cho màn hướng dẫn quét QR
@property (nonatomic, nullable) UIView *viewScanMRZCode;

// vùng tuỳ chỉnh cho phép quét MRZ
@property (nonatomic) CGRect frameViewScanMRZCode;

#pragma mark - Phương thức thực hiện từ phía bên ngoài

/**
 * Phương thức thực hiện đọc thông tin thẻ căn cước từ phía bên ngoài ứng dụng. Không sử dụng giao diện của SDK
 * Truyền thông tin số ID, ngày sinh, ngày hết hạn
 * Sau khi thực hiện đọc thông tin. Dữ liệu trả về các trạng thái:
 * - Bắt đầu đọc
 * - Đang đọc
 * - Kết thúc
 * - Lỗi
 */
- (void)startNFCReaderOutSide;


/**
 * Phương thức trả về thông tin phiên bản của SDK
 * Phương thức được gọi từ phía ngoài ứng dụng.
 */
+ (NSString *)getVersionSDK;

@end

NS_ASSUME_NONNULL_END
