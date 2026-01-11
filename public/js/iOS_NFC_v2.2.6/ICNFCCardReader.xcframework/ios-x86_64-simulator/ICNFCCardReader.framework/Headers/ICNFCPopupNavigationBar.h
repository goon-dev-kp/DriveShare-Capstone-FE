//
//  ICNFCPopupNavigationBar.h
//  ICNFCCardReader
//
//  Created by Minh Minh iOS on 07/07/2021.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface ICNFCPopupNavigationBar : UINavigationBar

/**
 Indicates if the navigation bar is draggable to dissmiss the popup.
 Default to YES.
 */
@property (nonatomic, assign) BOOL draggable;

@end

NS_ASSUME_NONNULL_END
