//
//  UIViewController+ICNFCPopup.h
//  ICNFCCardReader
//
//  Created by Minh Minh iOS on 07/07/2021.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class ICNFCPopupController;

@interface UIViewController (ICNFCPopup)

/**
 Content size of popup in portrait orientation.
 */
@property (nonatomic, assign) IBInspectable CGSize contentSizeInPopup;

/**
 Content size of popup in landscape orientation.
 */
@property (nonatomic, assign) IBInspectable CGSize landscapeContentSizeInPopup;

/**
 Popup controller which is containing the view controller.
 Will be nil if the view controller is not contained in any popup controller.
 */
@property (nullable, nonatomic, weak, readonly) ICNFCPopupController *popupController;

@end

NS_ASSUME_NONNULL_END
