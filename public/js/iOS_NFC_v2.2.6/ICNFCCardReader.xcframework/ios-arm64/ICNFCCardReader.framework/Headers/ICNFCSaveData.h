//
//  ICNFCSaveData.h
//  ICNFCCardReader
//
//  Created by Minh Nguyễn on 19/12/2021.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "ICMainNFCReaderProtocols.h"
#import "ICNFCPersonalInformation.h"

NS_ASSUME_NONNULL_BEGIN

@interface ICNFCSaveData : NSObject

+ (ICNFCSaveData *)shared;

@property (nonatomic) BOOL isPrintLogRequest;

- (void) resetOrInitAllData;



// Ảnh mã MRZ đã cắt, chụp được khi quét thành công mã.
@property (nonatomic) UIImage *imageBackCardCropped;

// Đường dẫn Ảnh mã MRZ đã cắt
@property (nonatomic) NSURL *pathImageBackCardCropped;

// Ảnh đại diện của chủ giấy tờ, lấy được sau khi đọc thông tin qua NFC
@property (nonatomic) UIImage *imageAvatar;

// Đường dẫn ảnh đại diện
@property (nonatomic) NSURL *pathImageAvatar;

// Mã ảnh đại diện sau khi tải ảnh lên phía máy chủ
@property (nonatomic) NSString *hashImageAvatar;

// Mã tệp DGs sau khi tải ảnh lên phía máy chủ
@property (nonatomic) NSString *hashDatagroups;

// Giá trị được trả ra để ghép vào các luồng khác để đảm bảo các giao dịch cùng trong một phiên
@property (nonatomic) NSString *clientSessionResult;

// Thông tin cá nhân
@property (nonatomic) ICNFCPersonalInformation *personalInformation;

// Dữ liệu đọc thông tin thẻ căn cước bằng NFC như số giấy tờ, họ tên, ngày sinh
@property (nonatomic) NSDictionary<NSString *, id> *dataNFCResult;

// Dữ liệu nguyên bản sau khi đọc thông tin thẻ căn cước bằng NFC, bao gồm các mã: COM, DG1, DG2, … DG14, DG15
@property (nonatomic) NSDictionary<NSString *, id> *dataGroupsResult;

// Dữ liệu sau khi kiểm tra mã bưu chính của Quê quán
@property (nonatomic) NSDictionary<NSString *, id> *postcodeOriginalLocationResult;

// Dữ liệu sau khi kiểm tra mã bưu chính của Nơi thường trú
@property (nonatomic) NSDictionary<NSString *, id> *postcodeRecentLocationResult;

// Dữ liệu quét mã QR
@property (nonatomic) NSString *qrCodeResult;

// Dữ liệu đoạn mã khi ứng dụng bật chức năng WaterMark
@property (nonatomic) NSString *tokenWaterMark;

// Trạng thái xác thực chip đang kích hoạt
@property (nonatomic) ICNFCAuthenticationStatus statusActiveAuthentication;

// Trạng thái xác thực chip không phải giả mạo
@property (nonatomic) ICNFCAuthenticationStatus statusChipAuthentication;

// Thông tin id ưu tiên
@property (nonatomic) NSString *transactionId;

// Thông tin partner id ưu tiên
@property (nonatomic) NSString *transactionPartnerId;

// Dữ liệu khi bị lỗi với các trường
@property (nonatomic) NSString *hashAvatarForLog;
@property (nonatomic) NSString *hashDGsForLog;
@property (nonatomic) NSString *nfcForLog;
@property (nonatomic) NSString *matchingOriginForLog;
@property (nonatomic) NSString *matchingResidenceForLog;

@end

NS_ASSUME_NONNULL_END
