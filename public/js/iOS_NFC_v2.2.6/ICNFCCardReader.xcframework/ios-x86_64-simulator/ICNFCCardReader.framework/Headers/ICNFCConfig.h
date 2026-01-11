//
//  ICNFCConfig.h
//  ICNFCCardReader
//
//  Created by MinhMinh on 07/12/2022.
//  Copyright © 2022 Innovation Center - VNPT IT. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ICMainNFCReaderProtocols.h"
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface ICNFCConfig : NSObject

+ (ICNFCConfig *)shared;


#pragma mark - /*========== CÁC THUỘC TÍNH CƠ BẢN CÀI ĐẶT CHUNG SDK ==========*/

// Giá trị này xác định ngôn ngữ được sử dụng trong SDK. Mặc định là icnfc_vi
// - icnfc_vi: Tiếng Việt
// - icnfc_en: Tiếng Anh
@property (nonatomic) NSString *languageSdk;

// Giá trị này dùng để đảm bảo mỗi yêu cầu (request) từ phía khách hàng sẽ không bị thay đổi. ✓
// Sau mỗi request, dữ liệu trả về sẽ bao gồm giá trị challengeCode. Mặc định là "11111"
@property (nonatomic) NSString *challengeCode;

// Giá trị này được truyền vào để xác định nhiều luồng giao dịch trong một phiên. Mặc định ""
@property (nonatomic) NSString *clientSession;

// Giá trị để xác định sử dụng watermark hay không. Mặc định false
@property (nonatomic) BOOL isEnableWaterMark;
@property (nonatomic) NSString *tokenWaterMark;

// Giá trị xác định bật tính năng thêm thông tin phục vụ IDCheck vào trong body request của api upload nfc. Mặc định false (Không thực hiện)
@property (nonatomic) BOOL isEnableAddIdCheckData;

// Public Key cho việc mã hoá thông tin
@property (nonatomic) NSString *publicKey;

// Giá trị xác định bật tính năng mã hoá thông tin
@property (nonatomic) BOOL isEnableEncrypt;

#pragma mark - /*========== CÁC THUỘC TÍNH VỀ TOKEN SỬ DỤNG DỊCH VỤ ==========*/
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


#pragma mark - /*========== CÁC THUỘC TÍNH VỀ API ==========*/

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

#pragma mark - /*========== CÁC THUỘC TÍNH VỀ CÀI ĐẶT MÀU SẮC GIAO DIỆN TRONG SDK ==========*/

// 1. Thanh header: PA 1 nút đóng bên phải. PA 2 nút đóng bên trái. mặc định là PA 1
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


#pragma mark - /*========== CÁC THUỘC TÍNH VỀ TRADEMARK ==========*/

// Hiển thị ảnh thương hiệu ở góc dưới màn hình. Mặc định false
@property (nonatomic) BOOL isShowLogo;

// Ảnh thương hiệu hiển thị cuối màn hình. Mặc định là ảnh thương hiệu VNPT
@property (nonatomic) UIImage *logo;

// Chiều rộng của ảnh thương hiệu, tối thiếu là 0, tối đa bằng bề rộng màn hình
@property (nonatomic) CGFloat withLogo;

// Chiều cao của ảnh thương hiệu, tối thiếu là 0, tối đa bằng chiều cao màn hình
@property (nonatomic) CGFloat heightLogo;


#pragma mark - /*========== CÁC THUỘC TÍNH VỀ TUỲ CHỈNH MÀN HÌNH ==========*/
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

@end

NS_ASSUME_NONNULL_END
