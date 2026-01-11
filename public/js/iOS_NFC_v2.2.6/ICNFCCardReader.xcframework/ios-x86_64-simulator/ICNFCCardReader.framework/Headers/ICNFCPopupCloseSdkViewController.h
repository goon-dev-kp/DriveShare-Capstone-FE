//
//  ICNFCPopupCloseSdkViewController.h
//  ICNFCCardReader
//
//  Created by MinhMinh on 17/04/2022.
//  Copyright © 2022 Innovation Center - VNPT IT. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ICNFCPopup.h"
#import "ICNFCBaseViewController.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ICPopupCloseSdkDelegate <NSObject>

/**
 * Phương thức DELEGATE được thực hiện khi người dùng nhấn nút CÓ (bên trái) ở màn hình Cảnh báo đóng SDK
 */
- (void) icPopupCloseSdkPressedLeft;

/**
 * Phương thức DELEGATE được thực hiện khi người dùng nhấn nút KHÔNG (bên phải) ở màn hình Cảnh báo đóng SDK
 */
- (void) icPopupCloseSdkPressedRight;

@end

@interface ICNFCPopupCloseSdkViewController : ICNFCBaseViewController

@property (nonatomic) id<ICPopupCloseSdkDelegate> delegate;


@end

NS_ASSUME_NONNULL_END
