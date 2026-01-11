//
//  ICNfcInformation.h
//  ICNFCCardReader
//
//  Created by Falcon on 16/04/2024.
//  Copyright © 2024 Innovation Center - VNPT IT. All rights reserved.
//

NS_ASSUME_NONNULL_BEGIN

@interface ICNFCPersonalInformation : NSObject

// - Số ID Căn cước
@property (nonatomic) NSString *idCard;

// - Họ và tên
@property (nonatomic) NSString *name;

// - Ngày sinh
@property (nonatomic) NSString *birthday;

// - Giới tính
@property (nonatomic) NSString *gender;

// - Quốc tịch
@property (nonatomic) NSString *nationality;

// - Dân tộc
@property (nonatomic) NSString *ethnic;

// - Tôn giáo
@property (nonatomic) NSString *religion;

// - Nơi sinh
@property (nonatomic) NSString *originLocation;

// - Nơi thường trú
@property (nonatomic) NSString *recentLocation;

// - Đặc điểm nhận dạng
@property (nonatomic) NSString *features;

// - Ngày cấp
@property (nonatomic) NSString *issueDate;

// - Ngày hết hạn
@property (nonatomic) NSString *validDate;

// - Họ tên cha
@property (nonatomic) NSString *dadName;

// - Họ tên mẹ
@property (nonatomic) NSString *momName;

// - Họ tên vợ/chồng
@property (nonatomic) NSString *spouseName;

// - Số CMND cũ
@property (nonatomic) NSString *oldId;

// - Nơi cấp
@property (nonatomic) NSString *issuePlace;

// - Số ID Căn cước
@property (nonatomic) NSArray<NSString *> *mrzs;

@end

NS_ASSUME_NONNULL_END

